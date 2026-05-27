// server/repositories/buseta.repository.ts
import { prisma } from '../utils/prisma'

export class BusetaRepository {
  /**
   * Busca una buseta por su placa.
   */
  async findByPlaca(placa: string) {
    return await prisma.buseta.findUnique({
      where: { placa },
      include: {
        empresa: true,
        lector: true,
        busetaRutas: {
          include: {
            ruta: true,
          },
        },
      },
    })
  }

  /**
   * Busca una buseta a partir del número de serie de su lector QR.
   */
  async findByLectorSerie(numeroSerie: string) {
    const lector = await prisma.lectorQR.findUnique({
      where: { numeroSerie },
      include: {
        buseta: {
          include: {
            empresa: true,
            busetaRutas: {
              where: { activa: true },
              include: {
                ruta: true,
              },
            },
          },
        },
      },
    })
    return lector ? lector.buseta : null
  }

  /**
   * Obtiene la primera buseta activa registrada (útil para fallbacks en simulación).
   */
  async findFirstActive() {
    return await prisma.buseta.findFirst({
      where: { activa: true },
      include: {
        empresa: true,
        busetaRutas: {
          include: {
            ruta: true,
          },
        },
      },
    })
  }
}

export const busetaRepository = new BusetaRepository()
