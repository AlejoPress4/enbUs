// server/api/auth/register.post.ts
import { authService } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { nombre, apellido, correo, contrasena } = body

  // Validaciones básicas de campos requeridos
  if (!nombre || !apellido || !correo || !contrasena) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Todos los campos (nombre, apellido, correo, contrasena) son obligatorios.',
    })
  }

  try {
    return await authService.register(nombre, apellido, correo, contrasena)
  } catch (error: any) {
    throw error
  }
})
