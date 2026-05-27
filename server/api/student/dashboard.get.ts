// server/api/student/dashboard.get.ts
import { userRepository } from '../../repositories/user.repository'
import { servicioRepository } from '../../repositories/servicio.repository'

export default defineEventHandler(async (event) => {
  const usuario = event.context.user

  if (!usuario || !usuario.sub) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Acceso no autorizado: Estudiante ausente en sesión.',
    })
  }

  const estudianteId = usuario.sub

  try {
    // 1. Obtener datos del estudiante en tiempo real
    const estudiante = await userRepository.findById(estudianteId)
    if (!estudiante) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Estudiante no registrado.',
      })
    }

    // 2. Obtener historial de viajes del estudiante
    const historialRaw = await servicioRepository.findHistoryByUsuario(estudianteId)

    // 3. Calcular métricas
    // Ahorro acumulado en pesos COP (ej: tarifa plena $2.800, tarifa preferencial estudiantil $1.800 => Ahorro = $1.000 por pasaje)
    const TARIFA_AHORRO_COP = 1000

    const viajesAprobados = historialRaw.filter(
      (v) => v.resultadoValidacion === 'APROBADO'
    )
    const viajesTotalesConteo = viajesAprobados.length
    const ahorroAcumuladoCop = viajesTotalesConteo * TARIFA_AHORRO_COP

    // 4. Mapear el historial para el Frontend
    const historial = historialRaw.map((v) => ({
      id: v.id,
      placaBuseta: v.buseta.placa,
      numeroInternoBuseta: v.buseta.numeroInterno,
      empresaTransporte: v.buseta.empresa.nombre,
      fechaHora: v.fechaHoraValidacion || v.fechaGeneracion,
      estado: v.estado,
      resultado: v.resultadoValidacion,
      motivoRechazo: v.motivoRechazo,
    }))

    return {
      perfil: {
        id: estudiante.id,
        nombre: estudiante.nombre,
        apellido: estudiante.apellido,
        correo: estudiante.correoInstitucional,
        institucion: estudiante.institucion.nombre,
        cuotaRestanteMes: estudiante.cuotaRestanteMes,
        viajesTotalesEsteMes: viajesTotalesConteo,
        ahorroAcumuladoCop,
      },
      historial,
    }
  } catch (error: any) {
    throw error
  }
})
