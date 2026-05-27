// server/repositories/cuota.repository.ts
import { prisma } from '../utils/prisma'

export class CuotaRepository {
  /**
   * Busca la cuota mensual de un usuario para un mes y año determinados.
   */
  async findByUsuarioPeriodo(usuarioId: string, mes: number, anio: number) {
    return await prisma.cuotaMensual.findUnique({
      where: {
        usuarioId_mes_anio: {
          usuarioId,
          mes,
          anio,
        },
      },
    })
  }

  /**
   * Crea una nueva cuota mensual inicial para un estudiante.
   */
  async createInitial(usuarioId: string, mes: number, anio: number, limiteUsos = 5) {
    return await prisma.cuotaMensual.create({
      data: {
        usuarioId,
        mes,
        anio,
        usosRealizados: 0,
        limiteUsos,
      },
    })
  }

  /**
   * Incrementa el número de usos realizados en la cuota del estudiante.
   */
  async incrementUsos(id: string) {
    return await prisma.cuotaMensual.update({
      where: { id },
      data: {
        usosRealizados: {
          increment: 1,
        },
      },
    })
  }
}

export const cuotaRepository = new CuotaRepository()
