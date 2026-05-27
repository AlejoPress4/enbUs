// server/api/qr/generate.post.ts
import { qrService } from '../../services/qr.service'

export default defineEventHandler(async (event) => {
  // event.context.user ya está poblado por el middleware de seguridad auth.ts
  const usuario = event.context.user

  if (!usuario || !usuario.sub) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Acceso no autorizado: Titular de sesión ausente.',
    })
  }

  try {
    return await qrService.generateQr(usuario.sub)
  } catch (error: any) {
    throw error
  }
})
