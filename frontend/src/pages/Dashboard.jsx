import { useState, useEffect, useRef, useCallback } from 'react'
import { studentApi } from '../api/student'
import { qrApi } from '../api/qr'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import QrDisplay from '../components/QrDisplay'
import TripHistory from '../components/TripHistory'

export default function Dashboard() {
  const { user, updateCuota } = useAuth()

  // Dashboard remoto
  const [dashData,    setDashData]    = useState(null)
  const [loadingDash, setLoadingDash] = useState(true)
  const [dashError,   setDashError]   = useState(null)

  // QR
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
          setQrError('El código QR ha expirado. Genera uno nuevo.')
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

  const cuota = dashData?.perfil?.cuotaRestanteMes ?? user?.cuotaRestante ?? 0
  const cuotaMax = 5
  const cuotaPct = Math.min((cuota / cuotaMax) * 100, 100)

  return (
    <Layout>
      {/* Greeting */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-800">
          Hola, {user?.nombre} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">{user?.institucion || 'Universidad de Caldas'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* QR Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-700 mb-6">Tu Pasaje Digital</h2>
          <QrDisplay
            token={qrToken}
            secondsLeft={secondsLeft}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            error={qrError}
            cuotaRestante={cuota}
          />
        </div>

        {/* Stats sidebar */}
        <div className="flex flex-col gap-4">

          {/* Quota card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Pasajes disponibles
            </p>
            <div className="flex items-end gap-1 mb-3">
              <span className={`text-5xl font-extrabold leading-none ${cuota > 1 ? 'text-brand-blue' : cuota === 1 ? 'text-orange-500' : 'text-red-500'}`}>
                {cuota}
              </span>
              <span className="text-gray-400 text-sm mb-1.5">/ {cuotaMax} este mes</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  cuota > 2 ? 'bg-brand-orange' : cuota > 0 ? 'bg-orange-300' : 'bg-red-400'
                }`}
                style={{ width: `${cuotaPct}%` }}
              />
            </div>
            {cuota === 0 && (
              <p className="text-xs text-red-500 mt-2 font-medium">
                Cupo mensual agotado
              </p>
            )}
          </div>

          {/* Savings card */}
          <div className="bg-brand-blue rounded-2xl p-5 text-white">
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-wide mb-1">
              Ahorro acumulado
            </p>
            <p className="text-3xl font-extrabold">
              ${(dashData?.perfil?.ahorroAcumuladoCop ?? 0).toLocaleString('es-CO')}
            </p>
            <p className="text-blue-300 text-xs mt-1.5">COP</p>
            <div className="mt-3 border-t border-blue-600 pt-3">
              <p className="text-blue-200 text-xs">
                {dashData?.perfil?.viajesTotalesEsteMes ?? 0} viaje{dashData?.perfil?.viajesTotalesEsteMes !== 1 ? 's' : ''} aprobado{dashData?.perfil?.viajesTotalesEsteMes !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Account info */}
          <div className="bg-brand-orange-lt border border-orange-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-brand-orange-dk uppercase tracking-wide mb-1">
              Institución
            </p>
            <p className="text-sm font-bold text-gray-800">{user?.institucion}</p>
            <p className="text-xs text-gray-500 mt-0.5 break-all">{user?.correo}</p>
          </div>
        </div>
      </div>

      {/* Trip history */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-700">Historial de viajes</h2>
          {!loadingDash && (
            <button
              onClick={fetchDashboard}
              className="text-xs text-brand-blue hover:underline"
            >
              Actualizar
            </button>
          )}
        </div>

        {loadingDash ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <span className="animate-spin inline-block w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
            <p className="text-gray-400 text-sm mt-3">Cargando historial...</p>
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
