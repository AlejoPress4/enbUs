import { QRCodeSVG } from 'qrcode.react'

export default function QrDisplay({ token, secondsLeft, onGenerate, isGenerating, error, cuotaRestante }) {
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const urgent   = secondsLeft > 0 && secondsLeft <= 60
  const warning  = secondsLeft > 60 && secondsLeft <= 120
  const timerCls = urgent
    ? 'text-red-500'
    : warning
    ? 'text-orange-500'
    : 'text-green-600'

  if (token) {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* QR Frame */}
        <div className={`p-4 rounded-2xl shadow-lg border-4 transition-colors ${urgent ? 'border-red-400' : 'border-brand-blue'}`}>
          <QRCodeSVG
            value={token}
            size={220}
            bgColor="#ffffff"
            fgColor="#1B3D7A"
            level="M"
            includeMargin={false}
          />
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm mb-1">
            Muestra este código al subir a la buseta
          </p>
          <p className={`text-4xl font-mono font-bold ${timerCls}`}>{timeStr}</p>
          <p className="text-xs text-gray-400 mt-0.5">tiempo restante</p>
          {urgent && (
            <p className="text-xs text-red-500 font-medium mt-1 animate-pulse">
              ⚠️ El código expira pronto
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center max-w-xs">
          {error}
        </div>
      )}

      {/* Placeholder */}
      <div className="w-56 h-56 bg-brand-blue-light border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center gap-2">
        <span className="text-5xl">🎫</span>
        <p className="text-brand-blue text-sm font-medium text-center px-4">
          Tu pasaje digital aparecerá aquí
        </p>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || cuotaRestante <= 0}
        className="
          w-full max-w-xs
          bg-brand-orange hover:bg-brand-orange-dk
          disabled:opacity-50 disabled:cursor-not-allowed
          text-white font-bold py-4 px-8 rounded-xl text-base
          transition-all duration-150
          shadow-lg shadow-orange-200
          active:scale-95
        "
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Generando...
          </span>
        ) : (
          '🎫 Generar mi pasaje'
        )}
      </button>

      {cuotaRestante <= 0 && (
        <p className="text-sm text-red-500 font-medium text-center">
          No tienes pasajes disponibles este mes
        </p>
      )}
    </div>
  )
}
