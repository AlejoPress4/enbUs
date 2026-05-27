const fmt = (dateStr) =>
  new Date(dateStr).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })

export default function TripHistory({ trips }) {
  if (!trips || trips.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center gap-3">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
          <span className="text-3xl">🚌</span>
        </div>
        <p className="text-gray-400 text-sm text-center">Aún no tienes viajes registrados</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {trips.map((trip, i) => (
        <div
          key={trip.id || i}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-4"
        >
          {/* Status dot */}
          <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
            trip.resultado === 'APROBADO' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <span className="text-lg">{trip.resultado === 'APROBADO' ? '✅' : '❌'}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800 truncate">
                Buseta {trip.numeroInternoBuseta}
                <span className="text-gray-400 font-normal ml-1 text-xs">({trip.placaBuseta})</span>
              </p>
              <span className={`text-xs font-bold flex-shrink-0 ml-2 ${
                trip.resultado === 'APROBADO' ? 'text-green-600' : 'text-red-500'
              }`}>
                {trip.resultado === 'APROBADO' ? 'Aprobado' : 'Rechazado'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {trip.empresaTransporte} · {fmt(trip.fechaHora)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
