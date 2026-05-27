// server/repositories/servicio.repository.ts
import { prisma } from '../utils/prisma'

export class ServicioRepository {
  /**
   * Registra un nuevo servicio en estado PENDIENTE cuando se genera el QR.
   */
  async createPending(data: {
    usuarioId: string
    busetaId: string
    tokenCifrado: string
    fechaExpiracion: Date
  }) {
    return await prisma.servicio.create({
      data: {
        usuarioId: data.usuarioId,
        busetaId: data.busetaId,
        tokenCifrado: data.tokenCifrado,
        fechaExpiracion: data.fechaExpiracion,
        estado: 'PENDIENTE',
      },
    })
  }

  /**
   * Busca un servicio por su token cifrado.
   */
  async findByToken(token: string) {
    return await prisma.servicio.findFirst({
      where: { tokenCifrado: token },
      include: {
        usuario: true,
        buseta: {
          include: {
            empresa: true,
          },
        },
      },
    })
  }

  /**
   * Marca un viaje como VALIDADO y APROBADO.
   */
  async approveValidation(id: string) {
    return await prisma.servicio.update({
      where: { id },
      data: {
        estado: 'VALIDADO',
        resultadoValidacion: 'APROBADO',
        fechaHoraValidacion: new Date(),
      },
    })
  }

  /**
   * Registra una validación fallida directa (rechazada) en el sistema.
   */
  async rejectValidation(data: {
    usuarioId: string
    busetaId: string
    tokenCifrado?: string
    motivoRechazo: string
  }) {
    return await prisma.servicio.create({
      data: {
        usuarioId: data.usuarioId,
        busetaId: data.busetaId,
        tokenCifrado: data.tokenCifrado || null,
        estado: 'RECHAZADO',
        resultadoValidacion: 'RECHAZADO',
        motivoRechazo: data.motivoRechazo,
        fechaHoraValidacion: new Date(),
      },
    })
  }

  /**
   * Obtiene el historial de viajes de un estudiante.
   */
  async findHistoryByUsuario(usuarioId: string) {
    return await prisma.servicio.findMany({
      where: {
        usuarioId,
      },
      include: {
        buseta: {
          include: {
            empresa: true,
          },
        },
      },
      orderBy: {
        fechaGeneracion: 'desc',
      },
    })
  }

  /**
   * Obtiene todos los viajes exitosos (validados) del día o mes para informes.
   */
  async getValidationsGroupedByCompany() {
    return await prisma.servicio.findMany({
      where: {
        resultadoValidacion: 'APROBADO',
      },
      include: {
        buseta: {
          include: {
            empresa: true,
            busetaRutas: {
              include: {
                ruta: true,
              },
            },
          },
        },
      },
    })
  }
}

export const servicioRepository = new ServicioRepository()
