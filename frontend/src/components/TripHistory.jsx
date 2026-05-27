const fmt = (dateStr) =>
  new Date(dateStr).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })

export default function TripHistory({ trips }) {
  if (!trips || trips.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <span className="text-4xl">🚌</span>
        <p className="text-gray-400 mt-3 text-sm">Aún no tienes viajes registrados</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Fecha</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Buseta</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Empresa</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip, i) => (
              <tr key={trip.id || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                  {fmt(trip.fechaHora)}
                </td>
                <td className="px-5 py-3 font-medium text-brand-blue whitespace-nowrap">
                  {trip.numeroInternoBuseta}
                  <span className="text-gray-400 font-normal ml-1 text-xs">({trip.placaBuseta})</span>
                </td>
                <td className="px-5 py-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">
                  {trip.empresaTransporte}
                </td>
                <td className="px-5 py-3">
                  {trip.resultado === 'APROBADO' ? (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      ✅ Aprobado
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full cursor-help"
                      title={trip.motivoRechazo || 'Rechazado'}
                    >
                      ❌ Rechazado
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
