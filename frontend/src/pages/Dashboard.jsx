import { useState, useEffect, useRef, useCallback } from 'react'
import { studentApi } from '../api/student'
import { qrApi } from '../api/qr'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import QrDisplay from '../components/QrDisplay'
import TripHistory from '../components/TripHistory'

export default function Dashboard() {
  const { user, updateCuota } = useAuth()

  const [dashData,    setDashData]    = useState(null)
  const [loadingDash, setLoadingDash] = useState(true)
  const [dashError,   setDashError]   = useState(null)

  const [qrToken,      setQrToken]      = useState(null)
  const [secondsLeft,  setSecondsLeft]  = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrError,      setQrError]      = useState(null)
  const timerRef = useRef(null)

  const fetchDashboard = useCallback(async () => {
    setLoadingDash(true)
    setDashError(null)
    try {
      const data = await studentApi.dashboard()
      setDashData(data)
    } catch (err) {
      setDashError(err.message)
    } finally {
      setLoadingDash(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [fetchDashboard])

  const startTimer = (seconds) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSecondsLeft(seconds)
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setQrToken(null)
          setQrError('El código QR expiró. Genera uno nuevo.')
          fetchDashboard()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setQrError(null)
    try {
      const data = await qrApi.generate()
      setQrToken(data.token)
      updateCuota(data.cuotaRestante)
      startTimer(data.expiraEnSegundos || 300)
    } catch (err) {
      setQrError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const cuota    = dashData?.perfil?.cuotaRestanteMes ?? user?.cuotaRestante ?? 0
  const cuotaMax = 5
  const ahorro   = dashData?.perfil?.ahorroAcumuladoCop ?? 0
  const viajes   = dashData?.perfil?.viajesTotalesEsteMes ?? 0

  const cuotaColor = cuota > 2 ? 'text-brand-blue' : cuota > 0 ? 'text-orange-500' : 'text-red-500'
  const barColor   = cuota > 2 ? 'bg-brand-orange' : cuota > 0 ? 'bg-orange-300' : 'bg-red-400'

  return (
    <Layout>

      {/* Greeting */}
      <div className="pt-2 pb-5">
        <p className="text-gray-400 text-sm">Bienvenido de vuelta</p>
        <h1 className="text-2xl font-extrabold text-gray-800 mt-0.5">
          {user?.nombre} {user?.apellido}
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className={`text-3xl font-extrabold leading-none ${cuotaColor}`}>{cuota}</p>
          <p className="text-gray-400 text-xs mt-1.5 font-medium">Pasajes</p>
          <div className="mt-2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${(cuota / cuotaMax) * 100}%` }} />
          </div>
        </div>

        <div className="bg-brand-blue rounded-2xl shadow-sm p-4 text-center">
          <p className="text-xl font-extrabold text-white leading-none">
            ${ahorro > 999 ? `${(ahorro / 1000).toFixed(0)}k` : ahorro}
          </p>
          <p className="text-blue-300 text-xs mt-1.5 font-medium">Ahorro</p>
          <p className="text-blue-400 text-xs mt-0.5">COP</p>
        </div>

        <div className="bg-brand-orange-lt border border-orange-100 rounded-2xl shadow-sm p-4 text-center">
          <p className="text-3xl font-extrabold text-brand-orange leading-none">{viajes}</p>
          <p className="text-orange-400 text-xs mt-1.5 font-medium">Viajes</p>
          <p className="text-orange-300 text-xs mt-0.5">este mes</p>
        </div>

      </div>

      {/* QR Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800">Tu Pasaje Digital</h2>
          {qrToken && (
            <span className="bg-green-50 text-green-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-100">
              Activo
            </span>
          )}
        </div>
        <QrDisplay
          token={qrToken}
          secondsLeft={secondsLeft}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          error={qrError}
          cuotaRestante={cuota}
        />
      </div>

      {/* Institution badge */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 mb-6 flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-blue-light rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-brand-blue text-lg">🎓</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-700 truncate">{user?.institucion || 'Universidad de Caldas'}</p>
          <p className="text-xs text-gray-400 truncate">{user?.correo}</p>
        </div>
      </div>

      {/* Trip history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">Historial de viajes</h2>
          {!loadingDash && (
            <button onClick={fetchDashboard} className="text-xs text-brand-blue font-medium hover:underline">
              Actualizar
            </button>
          )}
        </div>

        {loadingDash ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center gap-3">
            <span className="w-7 h-7 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Cargando historial...</p>
          </div>
        ) : dashError ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center text-red-400 text-sm">
            {dashError}
          </div>
        ) : (
          <TripHistory trips={dashData?.historial || []} />
        )}
      </div>

    </Layout>
  )
}
