// server/services/report.service.ts
import { servicioRepository } from '../repositories/servicio.repository'

export class ReportService {
  /**
   * Genera el informe consolidado para Empresas de Transporte y Alcaldía.
   */
  async getConsolidatedReport() {
    // 1. Obtener todos los servicios validados con éxito (APROBADO)
    const viajesAprobados = await servicioRepository.getValidationsGroupedByCompany()

    // 2. Estructuras para agregación
    const ventasPorEmpresa: Record<string, {
      id: string
      nombre: string
      totalVentasDia: number
      totalVentasMes: number
      totalHistorico: number
      busetasActivas: Record<string, number>
    }> = {}

    const pasajesPorRuta: Record<string, {
      id: string
      nombre: string
      origen: string
      destino: string
      ventas: number
    }> = {}

    const pasajesPorDia: Record<string, number> = {}

    const ahora = new Date()
    const hoyStr = ahora.toISOString().split('T')[0] || ''
    const mesActual = ahora.getMonth()

    // 3. Procesar viajes aprobados
    for (const viaje of viajesAprobados) {
      const fechaValidacion = viaje.fechaHoraValidacion || viaje.fechaGeneracion
      const fechaStr = fechaValidacion.toISOString().split('T')[0] || ''
      const mesViaje = fechaValidacion.getMonth()
      const anioViaje = fechaValidacion.getFullYear()

      // a. Agrupación por Día
      pasajesPorDia[fechaStr] = (pasajesPorDia[fechaStr] || 0) + 1

      // b. Agrupación por Empresa y Buseta
      const empresa = viaje.buseta.empresa
      if (!ventasPorEmpresa[empresa.id]) {
        ventasPorEmpresa[empresa.id] = {
          id: empresa.id,
          nombre: empresa.nombre,
          totalVentasDia: 0,
          totalVentasMes: 0,
          totalHistorico: 0,
          busetasActivas: {},
        }
      }

      const infoEmpresa = ventasPorEmpresa[empresa.id]
      if (infoEmpresa) {
        infoEmpresa.totalHistorico += 1

        if (fechaStr === hoyStr) {
          infoEmpresa.totalVentasDia += 1
        }

        if (mesViaje === mesActual && anioViaje === ahora.getFullYear()) {
          infoEmpresa.totalVentasMes += 1
        }

        // Conteo por buseta individual
        const placaBus = viaje.buseta.placa
        infoEmpresa.busetasActivas[placaBus] = (infoEmpresa.busetasActivas[placaBus] || 0) + 1
      }

      // c. Agrupación por Ruta
      // Obtenemos la ruta asociada a la buseta
      for (const br of viaje.buseta.busetaRutas) {
        const ruta = br.ruta
        if (!pasajesPorRuta[ruta.id]) {
          pasajesPorRuta[ruta.id] = {
            id: ruta.id,
            nombre: ruta.nombre,
            origen: ruta.origen,
            destino: ruta.destino,
            ventas: 0,
          }
        }
        const infoRuta = pasajesPorRuta[ruta.id]
        if (infoRuta) {
          infoRuta.ventas += 1
        }
      }
    }

    // 4. Formatear resultados para la API
    return {
      resumenGlobal: {
        totalPasajesDiferencialesHistóricos: viajesAprobados.length,
        totalPasajesHoy: pasajesPorDia[hoyStr] || 0,
        fechaReporte: ahora.toISOString(),
      },
      empresasTransporte: Object.values(ventasPorEmpresa).map(emp => ({
        ...emp,
        busetasActivas: Object.entries(emp.busetasActivas).map(([placa, total]) => ({
          placa,
          viajesRealizados: total
        }))
      })),
      rutasMasUsadas: Object.values(pasajesPorRuta).sort((a, b) => b.ventas - a.ventas),
      historialDiario: Object.entries(pasajesPorDia).map(([fecha, total]) => ({
        fecha,
        pasajesVendidos: total
      })).sort((a, b) => b.fecha.localeCompare(a.fecha))
    }
  }
}

export const reportService = new ReportService()
