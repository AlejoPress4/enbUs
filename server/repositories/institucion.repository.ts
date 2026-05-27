// server/repositories/institucion.repository.ts
import { prisma } from '../utils/prisma'

export class InstitucionRepository {
  /**
   * Busca una institución activa a partir del dominio del correo.
   * @param dominio Dominio a validar (ej: "ucaldas.edu.co")
   */
  async findByDominio(dominio: string) {
    return await prisma.institucion.findFirst({
      where: {
        dominioCorreo: dominio.toLowerCase().trim(),
        activa: true,
      },
    })
  }

  /**
   * Obtiene todas las instituciones activas.
   */
  async findAllActive() {
    return await prisma.institucion.findMany({
      where: { activa: true },
    })
  }
}
export const institucionRepository = new InstitucionRepository()
