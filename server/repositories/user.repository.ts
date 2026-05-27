// server/repositories/user.repository.ts
import { prisma } from '../utils/prisma'

export class UserRepository {
  /**
   * Busca un usuario por su correo institucional.
   */
  async findByCorreo(correo: string) {
    return await prisma.usuario.findUnique({
      where: {
        correoInstitucional: correo.toLowerCase().trim(),
      },
      include: {
        institucion: true,
      },
    })
  }

  /**
   * Busca un usuario por su ID.
   */
  async findById(id: string) {
    return await prisma.usuario.findUnique({
      where: { id },
      include: {
        institucion: true,
      },
    })
  }

  /**
   * Crea un nuevo usuario estudiante (inactivo por defecto hasta MFA).
   */
  async create(data: {
    nombre: string
    apellido: string
    correoInstitucional: string
    contrasenaHash: string
    institucionId: string
  }) {
    return await prisma.usuario.create({
      data: {
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        correoInstitucional: data.correoInstitucional.toLowerCase().trim(),
        contrasenaHash: data.contrasenaHash,
        institucionId: data.institucionId,
        estado: 'INACTIVO', // Comienza inactivo hasta verificación MFA
        cuotaRestanteMes: 5, // Límite por defecto = 5 pasajes
      },
    })
  }

  /**
   * Actualiza el estado de un usuario (ej. activar tras MFA).
   */
  async updateEstado(id: string, estado: 'ACTIVO' | 'INACTIVO') {
    return await prisma.usuario.update({
      where: { id },
      data: { estado },
    })
  }

  /**
   * Actualiza la cuota de pasajes diarios/mensuales restante en el usuario.
   */
  async updateCuotaRestante(id: string, cuotaRestante: number) {
    return await prisma.usuario.update({
      where: { id },
      data: { cuotaRestanteMes: cuotaRestante },
    })
  }

  /**
   * Registra la última fecha y hora en la que el usuario inició sesión.
   */
  async updateUltimoAcceso(id: string) {
    return await prisma.usuario.update({
      where: { id },
      data: { ultimoAcceso: new Date() },
    })
  }
}

export const userRepository = new UserRepository()
