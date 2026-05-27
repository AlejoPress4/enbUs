// server/api/qr/validate.post.ts
import { validationService } from '../../services/validation.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { token, lectorSerie } = body

  if (!token || !lectorSerie) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El token del código QR y el número de serie del Lector QR son requeridos.',
    })
  }

  try {
    return await validationService.validateQr(token, lectorSerie)
  } catch (error: any) {
    throw error
  }
})
