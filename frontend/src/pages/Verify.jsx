import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'

export default function Verify() {
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.verify(code)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#081e3f] via-brand-blue to-[#1a4faa] flex items-center justify-center p-4 overflow-hidden relative">

      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-orange opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-400 opacity-10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          <div className="px-8 pt-8 pb-5 flex flex-col items-center">
            <img src="/logo.jpg" alt="enbUs" className="h-14 object-contain" />
          </div>

          <div className="mx-6 h-px bg-gray-100" />

          {success ? (
            <div className="px-8 py-12 text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">¡Cuenta activada!</h3>
              <p className="text-gray-500 mt-2 text-sm">Redirigiendo al inicio de sesión...</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-brand-blue text-sm">
                <span className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Activar cuenta</h2>
                <p className="text-gray-500 text-sm mt-1">Ingresa el código de 6 dígitos que recibiste</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  required
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-4 text-3xl text-center tracking-[0.5em] font-mono text-brand-blue focus:outline-none focus:border-brand-blue focus:ring-0 transition"
                />
                <p className="text-xs text-gray-400 mt-2 text-center">Válido por 15 minutos</p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-brand-orange hover:bg-brand-orange-dk disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-orange-200/60 active:scale-[0.98]"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verificando...</span>
                  : 'Activar cuenta'}
              </button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">
                  <Link to="/register" className="text-brand-blue hover:underline">
                    ¿No recibiste el código? Regístrate de nuevo
                  </Link>
                </p>
                <p className="text-sm">
                  <Link to="/login" className="text-gray-400 hover:text-gray-600 transition-colors">
                    Volver al inicio de sesión
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-blue-300/50 text-xs mt-6">
          enbUs © 2026 · Universidad de Caldas
        </p>
      </div>
    </div>
  )
}
