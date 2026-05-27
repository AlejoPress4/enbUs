// server/api/reports/stakeholders.get.ts
import { reportService } from '../../services/report.service'

export default defineEventHandler(async (event) => {
  // En un entorno de producción real, validaríamos aquí si el usuario autenticado tiene el rol de ALCALDIA o EMPRESA
  // Para el MVP, permitimos que cualquier usuario autorizado consuma estas estadísticas
  const usuario = event.context.user

  if (!usuario) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Acceso no autorizado: Token de sesión requerido.',
    })
  }

  try {
    return await reportService.getConsolidatedReport()
  } catch (error: any) {
    throw error
  }
})
