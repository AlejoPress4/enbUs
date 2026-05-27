// server/services/qr.service.ts
import crypto from 'node:crypto'
import { createError } from 'h3'
import { userRepository } from '../repositories/user.repository'
import { servicioRepository } from '../repositories/servicio.repository'
import { busetaRepository } from '../repositories/buseta.repository'
import { cache } from '../utils/redis'

export class QrService {
  /**
   * Genera un código QR temporal y cifrado para un estudiante.
   * @param usuarioId ID del estudiante solicitante.
   */
  async generateQr(usuarioId: string) {
    // 1. Validar existencia y estado del estudiante
    const usuario = await userRepository.findById(usuarioId)
    if (!usuario) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Estudiante no registrado.',
      })
    }

    if (usuario.estado !== 'ACTIVO') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Tu usuario se encuentra inactivo. Completa la activación MFA.',
      })
    }

    // 2. Control de Uso: Verificar que le queden cupos/pasajes en el mes
    if (usuario.cuotaRestanteMes <= 0) {
      console.log(`\n🚨 [ALERTA DE CUPO AGOTADO] Estudiante ${usuario.correoInstitucional} intentó generar un QR sin cupo restante.`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Has alcanzado el límite de usos asignado por tu institución (5 pasajes).',
      })
    }

    // 3. Generar un token único, cifrado y volátil (un hash aleatorio seguro)
    const tokenCifrado = crypto.randomBytes(32).toString('hex')
    const ttlSegundos = 300 // 5 minutos

    // 4. Guardar en Redis con TTL de 5 minutos
    // El valor guardado será el ID del usuario para poder identificarlo al escanear
    const cacheKey = `qr:token:${tokenCifrado}`
    await cache.set(cacheKey, usuarioId, ttlSegundos)

    // 5. Registrar el viaje de forma provisional en la base de datos (SERVICIO) en estado PENDIENTE
    // Buscamos una buseta activa por defecto para satisfacer la integridad referencial de la DB
    const busetaDefault = await busetaRepository.findFirstActive()
    if (!busetaDefault) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Error de infraestructura: No hay busetas de transporte registradas en el sistema.',
      })
    }

    const fechaExpiracion = new Date(Date.now() + ttlSegundos * 1000)
    const servicioPendiente = await servicioRepository.createPending({
      usuarioId: usuario.id,
      busetaId: busetaDefault.id,
      tokenCifrado,
      fechaExpiracion,
    })

    console.log(`🎫 QR Temporal Generado para ${usuario.correoInstitucional}. ID Servicio: ${servicioPendiente.id}`)

    return {
      token: tokenCifrado,
      expiraEnSegundos: ttlSegundos,
      fechaExpiracion: fechaExpiracion.toISOString(),
      cuotaRestante: usuario.cuotaRestanteMes,
    }
  }
}

export const qrService = new QrService()
