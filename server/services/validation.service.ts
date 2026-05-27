// server/services/validation.service.ts
import { createError } from 'h3'
import { userRepository } from '../repositories/user.repository'
import { servicioRepository } from '../repositories/servicio.repository'
import { busetaRepository } from '../repositories/buseta.repository'
import { cuotaRepository } from '../repositories/cuota.repository'
import { cache } from '../utils/redis'
import { prisma } from '../utils/prisma'
import { notificationService } from './notification.service'

export class ValidationService {
  /**
   * Valida un código QR escaneado por el lector de una buseta.
   * @param token Código QR presentado por el estudiante.
   * @param lectorSerie Número de serie del Lector QR físico del bus.
   */
  async validateQr(token: string, lectorSerie: string) {
    console.log(`\n🔍 [INTENTO DE VALIDACIÓN] Token: ${token.substring(0, 10)}... Lector: ${lectorSerie}`)

    // 1. Validar que la buseta y su lector QR existan y estén autorizados
    const buseta = await busetaRepository.findByLectorSerie(lectorSerie)
    if (!buseta) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Dispositivo Lector QR no registrado o inactivo para el transporte.',
      })
    }

    const cacheKey = `qr:token:${token}`
    const usuarioId = await cache.get(cacheKey)

    // 2. CASO FALLIDO: El token no existe en Redis (Expiró, ya fue usado, o es falso)
    if (!usuarioId) {
      console.log(`❌ [VALIDACIÓN RECHAZADA] Token no válido en caché (Expirado o Doble Escaneo).`)

      // Buscar si el token existía de forma provisional en base de datos para registrar auditoría exacta
      const servicioProvisional = await servicioRepository.findByToken(token)
      if (servicioProvisional && servicioProvisional.estado === 'PENDIENTE') {
        // Actualizar el servicio registrado a RECHAZADO por expiración
        await prisma.servicio.update({
          where: { id: servicioProvisional.id },
          data: {
            estado: 'RECHAZADO',
            resultadoValidacion: 'RECHAZADO',
            motivoRechazo: 'Código QR expirado sin ser utilizado.',
            fechaHoraValidacion: new Date(),
            busetaId: buseta.id, // Registrar en qué buseta ocurrió el intento fallido
          },
        })

        return {
          success: false,
          status: 'RECHAZADO',
          message: 'Código QR expirado o ya utilizado.',
          motivo: 'Token ausente en caché temporal (expirado)',
          color: 'red',
          sound: 'error',
        }
      } else {
        // Es un código manipulado o ya utilizado (intento de doble escaneo)
        if (!servicioProvisional) {
          // El token no existe ni como provisional. Es un token inventado o modificado.
          // Como no sabemos de qué usuario es, no podemos registrar en la tabla SERVICIO (usuarioId es requerido).
          return {
            success: false,
            status: 'RECHAZADO',
            message: 'Código QR inválido o manipulado.',
            motivo: 'Token inexistente en el sistema',
            color: 'red',
            sound: 'error',
          }
        }

        // Registramos una NUEVA transacción de rechazo de auditoría para no alterar el viaje exitoso previo
        await prisma.servicio.create({
          data: {
            usuarioId: servicioProvisional.usuarioId,
            busetaId: buseta.id,
            tokenCifrado: token,
            estado: 'RECHAZADO',
            resultadoValidacion: 'RECHAZADO',
            motivoRechazo: 'Código QR ya utilizado anteriormente (Intento de doble escaneo).',
            fechaHoraValidacion: new Date(),
          }
        })

        return {
          success: false,
          status: 'RECHAZADO',
          message: 'El código QR ya fue utilizado.',
          motivo: 'Token ya verificado',
          color: 'red',
          sound: 'error',
        }
      }
    }

    // 3. CASO EXITOSO: El token existe en caché. Validar cuota y datos del estudiante en DB.
    const estudiante = await userRepository.findById(usuarioId)
    if (!estudiante) {
      // Caso improbable: El usuario fue eliminado tras generar el QR
      await cache.del(cacheKey)
      return {
        success: false,
        status: 'RECHAZADO',
        message: 'El estudiante titular ya no se encuentra registrado.',
        color: 'red',
        sound: 'error',
      }
    }

    // Doble verificación interna de cupos
    if (estudiante.cuotaRestanteMes <= 0) {
      await cache.del(cacheKey)
      await servicioRepository.rejectValidation({
        usuarioId: estudiante.id,
        busetaId: buseta.id,
        tokenCifrado: token,
        motivoRechazo: 'El estudiante no posee pasajes restantes.',
      })

      return {
        success: false,
        status: 'RECHAZADO',
        message: 'Límite de pasajes alcanzado.',
        usuario: `${estudiante.nombre} ${estudiante.apellido}`,
        color: 'red',
        sound: 'error',
      }
    }

    // 4. APROBACIÓN DEL VIAJE Y ACTUALIZACIÓN DE ESTADOS
    
    // a. Obtener la transacción provisional PENDIENTE y marcarla como VALIDADA en DB
    const servicioProvisional = await servicioRepository.findByToken(token)
    if (servicioProvisional) {
      await prisma.servicio.update({
        where: { id: servicioProvisional.id },
        data: {
          estado: 'VALIDADO',
          resultadoValidacion: 'APROBADO',
          fechaHoraValidacion: new Date(),
          busetaId: buseta.id, // Sobrescribir con la buseta real que realizó el escaneo
        },
      })
    } else {
      // Si por alguna razón no existía registro previo, se crea un viaje aprobado limpio
      await prisma.servicio.create({
        data: {
          usuarioId: estudiante.id,
          busetaId: buseta.id,
          tokenCifrado: token,
          estado: 'VALIDADO',
          resultadoValidacion: 'APROBADO',
          fechaHoraValidacion: new Date(),
        },
      })
    }

    // b. Decrementar cupo restante en el perfil del Usuario
    const nuevaCuota = estudiante.cuotaRestanteMes - 1
    await userRepository.updateCuotaRestante(estudiante.id, nuevaCuota)

    // c. Actualizar estadística de usos acumulados en la tabla CuotaMensual
    const ahora = new Date()
    const mes = ahora.getMonth() + 1
    const anio = ahora.getFullYear()
    const cuotaMensual = await cuotaRepository.findByUsuarioPeriodo(estudiante.id, mes, anio)
    if (cuotaMensual) {
      await cuotaRepository.incrementUsos(cuotaMensual.id)
    }

    // d. CRÍTICO: Eliminar token de caché (Redis) para evitar reuso (Prevención Doble Escaneo)
    await cache.del(cacheKey)

    // e. Enviar notificación Push al estudiante (vía Azure Hubs o simulador)
    await notificationService.sendTripNotification(estudiante.correoInstitucional, buseta.numeroInterno, nuevaCuota)

    console.log(`✅ [VALIDACIÓN EXITOSA] Pasaje descontado a ${estudiante.nombre} ${estudiante.apellido}. Restan: ${nuevaCuota}`)

    return {
      success: true,
      status: 'APROBADO',
      usuario: {
        nombre: estudiante.nombre,
        apellido: estudiante.apellido,
        correo: estudiante.correoInstitucional,
      },
      cuotaRestante: nuevaCuota,
      buseta: {
        placa: buseta.placa,
        numeroInterno: buseta.numeroInterno,
        empresa: buseta.empresa.nombre,
      },
      color: 'green',
      sound: 'bip',
    }
  }
}

export const validationService = new ValidationService()
