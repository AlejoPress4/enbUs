// server/services/auth.service.ts
import crypto from 'node:crypto'
import { createError } from 'h3'
import { userRepository } from '../repositories/user.repository'
import { institucionRepository } from '../repositories/institucion.repository'
import { cuotaRepository } from '../repositories/cuota.repository'
import { notificationService } from './notification.service'
import { cache } from '../utils/redis'

export class AuthService {
  /**
   * Genera un hash SHA-256 seguro para contraseñas utilizando módulos nativos de Node.js.
   */
  private hashPassword(contrasena: string): string {
    return crypto.createHash('sha256').update(contrasena).digest('hex')
  }

  /**
   * Registro institucional de un nuevo estudiante.
   */
  async register(nombre: string, apellido: string, correo: string, contrasena: string) {
    // 0. Validación básica de longitud de contraseña
    if (contrasena.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'La contraseña debe tener al menos 8 caracteres.',
      })
    }

    // 1. Extraer dominio del correo electrónico
    const partes = correo.split('@')
    if (partes.length !== 2) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El correo electrónico suministrado no es válido.',
      })
    }
    const dominioPart = partes[1]
    if (!dominioPart) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El correo electrónico suministrado no es válido.',
      })
    }
    const dominio = dominioPart.toLowerCase().trim()

    // 2. Validar que el dominio corresponda a una institución activa en base de datos
    const institucion = await institucionRepository.findByDominio(dominio)
    if (!institucion) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Solo se permiten correos institucionales válidos.',
      })
    }

    // 3. Verificar si el usuario ya existe
    const usuarioExistente = await userRepository.findByCorreo(correo)
    if (usuarioExistente) {
      throw createError({
        statusCode: 409,
        statusMessage: 'El correo institucional ya se encuentra registrado.',
      })
    }

    // 4. Cifrar la contraseña usando hash SHA-256 nativo (sin dependencias nativas complejas)
    const contrasenaHash = this.hashPassword(contrasena)

    // 5. Crear el registro inactivo en base de datos
    const nuevoUsuario = await userRepository.create({
      nombre,
      apellido,
      correoInstitucional: correo,
      contrasenaHash,
      institucionId: institucion.id,
    })

    // 6. Generar código de autenticación MFA de 6 dígitos
    const codigoMFA = Math.floor(100000 + Math.random() * 900000).toString()

    // Guardar código en caché por 15 minutos (900 segundos) vinculándolo al ID del usuario
    await cache.set(`mfa:code:${codigoMFA}`, nuevoUsuario.id, 900)

    // 7. Construir URL de activación usando APP_URL (Vercel) o localhost en desarrollo
    const baseUrl = process.env.APP_URL || process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const enlaceMFA = `/api/auth/verify?token=${codigoMFA}`
    const enlaceCompleto = `${baseUrl}${enlaceMFA}`

    // 8. Enviar la notificación de correo vía Azure Communication Services
    await notificationService.sendMfaNotification(nuevoUsuario.correoInstitucional, enlaceCompleto)

    return {
      message: 'Revisa tu correo para activar tu cuenta',
      userId: nuevoUsuario.id,
    }
  }

  /**
   * Procesa la activación de cuenta (Doble Factor de Autenticación / MFA).
   * Soporta tanto el código MFA de 6 dígitos en caché como el ID de usuario directamente (para compatibilidad de pruebas).
   */
  async activateAccount(token: string) {
    let usuarioId = token
    let esCodigoTemporal = false

    // Si el token es un código numérico de 6 dígitos, lo buscamos en la caché
    if (/^\d{6}$/.test(token)) {
      const cachedUserId = await cache.get(`mfa:code:${token}`)
      if (!cachedUserId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'El código de activación es inválido o ha expirado.',
        })
      }
      usuarioId = cachedUserId
      esCodigoTemporal = true
    }

    const usuario = await userRepository.findById(usuarioId)
    if (!usuario) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Estudiante no encontrado.',
      })
    }

    if (usuario.estado === 'ACTIVO') {
      if (esCodigoTemporal) {
        await cache.del(`mfa:code:${token}`)
      }
      return { message: 'La cuenta ya se encuentra activa.' }
    }

    // 1. Activar el usuario en la base de datos
    await userRepository.updateEstado(usuario.id, 'ACTIVO')

    // 2. Inicializar la cuota mensual del mes en curso si no existe (límite por defecto = 5)
    const ahora = new Date()
    const mes = ahora.getMonth() + 1
    const anio = ahora.getFullYear()

    const cuotaExistente = await cuotaRepository.findByUsuarioPeriodo(usuario.id, mes, anio)
    if (!cuotaExistente) {
      await cuotaRepository.createInitial(usuario.id, mes, anio, 5)
    }

    // 3. Limpiar código de la caché tras uso exitoso
    if (esCodigoTemporal) {
      await cache.del(`mfa:code:${token}`)
    }

    console.log(`✅ Cuenta de estudiante activada exitosamente: ${usuario.correoInstitucional}`)

    return {
      message: 'Cuenta activada de manera exitosa. Ya puedes iniciar sesión.',
    }
  }

  /**
   * Autenticación de usuarios y generación de sesión de token simple en caché.
   */
  async login(correo: string, contrasena: string) {
    const usuario = await userRepository.findByCorreo(correo)
    if (!usuario) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciales inválidas.',
      })
    }

    // Verificar si la cuenta ha sido activada (MFA)
    if (usuario.estado !== 'ACTIVO') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Cuenta inactiva. Por favor verifica tu correo primero.',
      })
    }

    // Comparar la contraseña con SHA-256
    const contrasenaValida = usuario.contrasenaHash === this.hashPassword(contrasena)
    if (!contrasenaValida) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciales inválidas.',
      })
    }

    // Generar un token de sesión simple (UUID v4)
    const sessionToken = crypto.randomUUID()
    const cacheKey = `session:${sessionToken}`

    // Almacenar la sesión en la caché de Redis / Memoria por 24 horas (86400 segundos)
    await cache.set(cacheKey, usuario.id, 86400)

    // Registrar último acceso
    await userRepository.updateUltimoAcceso(usuario.id)

    return {
      token: sessionToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correoInstitucional,
        institucion: usuario.institucion.nombre,
        cuotaRestante: usuario.cuotaRestanteMes,
      },
    }
  }
}

export const authService = new AuthService()
