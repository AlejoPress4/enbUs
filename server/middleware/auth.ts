// server/middleware/auth.ts
import { defineEventHandler, getRequestURL, getHeader, createError } from 'h3'
import { cache } from '../utils/redis'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  // 1. Definir qué endpoints requieren autenticación mediante token de sesión
  const rutasProtegidas = [
    '/api/qr/generate',
    '/api/qr/validate',
    '/api/student/dashboard',
    '/api/reports/stakeholders',
  ]

  const requiereAuth = rutasProtegidas.some((ruta) => path.startsWith(ruta))

  if (!requiereAuth) {
    return // Continuar sin validación si la ruta es pública
  }

  // 2. Extraer cabecera de Autorización Bearer
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Acceso no autorizado: Cabecera Authorization Bearer ausente.',
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    // 3. Verificar y decodificar el token de sesión contra la caché de Redis / Memoria
    const cacheKey = `session:${token}`
    const usuarioId = await cache.get(cacheKey)

    if (!usuarioId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Sesión inválida, expirada o inexistente.',
      })
    }

    // 4. Adjuntar información del usuario autenticado al contexto del evento
    event.context.user = {
      sub: usuarioId,
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 403,
      statusMessage: error.statusMessage || 'Token de sesión inválido, expirado o adulterado.',
    })
  }
})
