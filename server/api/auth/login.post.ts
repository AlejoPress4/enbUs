// server/api/auth/login.post.ts
import { authService } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { correo, contrasena } = body

  if (!correo || !contrasena) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El correo y la contraseña son obligatorios.',
    })
  }

  try {
    return await authService.login(correo, contrasena)
  } catch (error: any) {
    throw error
  }
})
