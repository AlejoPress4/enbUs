// server/api/auth/verify.get.ts
import { authService } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token as string

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Falta el token de verificación/activación.',
    })
  }

  try {
    return await authService.activateAccount(token)
  } catch (error: any) {
    throw error
  }
})
