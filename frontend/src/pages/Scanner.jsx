import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { qrApi } from '../api/qr'
import Layout from '../components/Layout'

function playSound(success) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    if (success) {
      osc.type = 'sine'
      osc.frequency.value = 800
      gain.gain.setValueAtTime(0.8, ctx.currentTime)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } else {
      osc.type = 'sawtooth'
      osc.frequency.value = 200
      gain.gain.setValueAtTime(0.8, ctx.currentTime)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    }
  } catch {}
}

export default function Scanner() {
  const [lectorSerie,  setLectorSerie]  = useState(() => localStorage.getItem('enbus_lector') || '')
  const [tempSerie,    setTempSerie]    = useState(() => localStorage.getItem('enbus_lector') || '')
  const [editingSerie, setEditingSerie] = useState(!localStorage.getItem('enbus_lector'))

  const [scanning,    setScanning]    = useState(false)
  const [processing,  setProcessing]  = useState(false)
  const [result,      setResult]      = useState(null)
  const [camError,    setCamError]    = useState(null)

  const scannerRef    = useRef(null)
  const processingRef = useRef(false)
  const resultTimer   = useRef(null)

  const saveSerie = () => {
    const val = tempSerie.trim().toUpperCase()
    if (!val) return
    setLectorSerie(val)
    localStorage.setItem('enbus_lector', val)
    setEditingSerie(false)
  }

  const startScanning = async () => {
    setCamError(null)
    try {
      const scanner = new Html5Qrcode('qr-reader-cam')
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (!processingRef.current) handleScan(decodedText)
        },
        () => {}
      )
      scannerRef.current = scanner
      setScanning(true)
    } catch (err) {
      setCamError('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setScanning(false)
  }

  const handleScan = async (token) => {
    processingRef.current = true
    setProcessing(true)
    setResult(null)

    try {
      const data = await qrApi.validate(token, lectorSerie)
      const res = {
        success:       data.success,
        status:        data.status,
        message:       data.message,
        usuario:       data.usuario,
        buseta:        data.buseta,
        cuotaRestante: data.cuotaRestante,
      }
      setResult(res)
      playSound(data.success)
    } catch (err) {
      setResult({ success: false, message: err.message })
      playSound(false)
    }

    if (resultTimer.current) clearTimeout(resultTimer.current)
    resultTimer.current = setTimeout(() => {
      setResult(null)
      setProcessing(false)
      processingRef.current = false
    }, 4000)
  }

  useEffect(() => {
    return () => {
      stopScanning()
      if (resultTimer.current) clearTimeout(resultTimer.current)
    }
  }, [])

  return (
    <Layout>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Panel del Conductor</h1>
          <p className="text-gray-500 text-sm mt-0.5">Valida el QR del estudiante al abordar la buseta</p>
        </div>

        {/* Lector serial config */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Número de serie del lector</p>
            {!editingSerie && (
              <button
                onClick={() => { stopScanning(); setTempSerie(lectorSerie); setEditingSerie(true) }}
                className="text-xs text-brand-blue hover:underline"
              >
                Cambiar
              </button>
            )}
          </div>

          {editingSerie ? (
            <div className="flex gap-2">
              <input
                value={tempSerie}
                onChange={(e) => setTempSerie(e.target.value.toUpperCase())}
                placeholder="Ej: SR-999-A"
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <button
                onClick={saveSerie}
                disabled={!tempSerie.trim()}
                className="bg-brand-blue hover:bg-brand-blue-mid disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Guardar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400" />
              <p className="font-mono font-bold text-brand-blue text-xl">{lectorSerie}</p>
            </div>
          )}
        </div>

        {/* Camera area */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* El div del scanner SIEMPRE está en el DOM — html5-qrcode lo necesita antes de inicializar */}
          <div id="qr-reader-cam" className={`w-full ${!scanning ? 'hidden' : ''}`} />

          {!scanning ? (
            <div className="p-10 text-center">
              <span className="text-6xl">📷</span>
              <p className="text-gray-500 text-sm mt-3 mb-6 leading-relaxed">
                {lectorSerie
                  ? 'Presiona el botón para activar la cámara y escanear el código QR del estudiante.'
                  : 'Primero ingresa el número de serie del lector de tu buseta.'}
              </p>
              {camError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-5">
                  {camError}
                </div>
              )}
              <button
                onClick={startScanning}
                disabled={!lectorSerie}
                className="bg-brand-orange hover:bg-brand-orange-dk disabled:opacity-50 text-white font-bold py-3.5 px-10 rounded-xl transition-colors shadow-lg shadow-orange-200 active:scale-95"
              >
                Activar cámara
              </button>
            </div>
          ) : (
            <div>
              <div className="px-4 py-3 flex items-center justify-between bg-gray-50 border-t border-gray-100">
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Escaneando...
                </span>
                <button
                  onClick={stopScanning}
                  className="text-sm text-red-500 hover:underline"
                >
                  Detener
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Result overlay */}
        {result && (
          <div
            className={`mt-5 rounded-2xl p-7 text-white text-center shadow-xl transition-all ${
              result.success ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <div className="text-6xl mb-2">
              {result.success ? '✅' : '❌'}
            </div>
            <p className="text-2xl font-extrabold tracking-wide">
              {result.success ? 'APROBADO' : 'RECHAZADO'}
            </p>

            {result.usuario && (
              <p className="mt-3 text-xl font-semibold">
                {result.usuario.nombre} {result.usuario.apellido}
              </p>
            )}

            <p className="mt-1 text-sm opacity-90">{result.message}</p>

            {result.success && result.cuotaRestante !== undefined && (
              <div className="mt-3 bg-white bg-opacity-20 rounded-xl px-4 py-2 inline-block">
                <p className="text-sm font-semibold">
                  {result.cuotaRestante} pasaje{result.cuotaRestante !== 1 ? 's' : ''} restante{result.cuotaRestante !== 1 ? 's' : ''} este mes
                </p>
              </div>
            )}

            {result.success && result.buseta && (
              <p className="mt-2 text-xs opacity-70">
                {result.buseta.empresa} · Buseta {result.buseta.numeroInterno}
              </p>
            )}

            <p className="mt-4 text-xs opacity-50">Se cerrará en unos segundos...</p>
          </div>
        )}

        {/* Instructions footer */}
        <div className="mt-6 bg-brand-blue-light rounded-2xl border border-blue-100 px-5 py-4">
          <p className="text-xs font-semibold text-brand-blue uppercase tracking-wide mb-2">
            Instrucciones
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>🟢 <strong>Verde + bip corto</strong> — Pasaje válido, cobro con tarifa diferencial</li>
            <li>🔴 <strong>Rojo + bip largo</strong> — Pasaje inválido, cobra tarifa normal</li>
            <li>⏱️ Los QR expiran en 5 minutos</li>
            <li>🔁 Cada QR sólo se puede escanear una vez</li>
          </ul>
        </div>

      </div>
    </Layout>
  )
}
