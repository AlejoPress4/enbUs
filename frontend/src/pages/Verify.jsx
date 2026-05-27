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
    <div className="min-h-screen bg-gradient-to-br from-brand-blue-dark via-brand-blue to-brand-blue-mid flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-6xl">🚌</span>
          <h1 className="text-4xl font-extrabold text-white mt-3 tracking-tight">
            en<span className="text-brand-orange">Bus</span>
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-brand-blue px-8 py-5">
            <h2 className="text-xl font-bold text-white">Activar cuenta</h2>
            <p className="text-blue-300 text-sm mt-0.5">Ingresa el código de 6 dígitos que recibiste</p>
          </div>

          {success ? (
            <div className="px-8 py-12 text-center">
              <span className="text-6xl">✅</span>
              <h3 className="text-2xl font-bold text-brand-blue mt-4">¡Cuenta activada!</h3>
              <p className="text-gray-500 mt-2 text-sm">Redirigiendo al inicio de sesión...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Código de verificación
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-4 text-3xl text-center tracking-[0.5em] font-mono focus:outline-none focus:border-brand-blue transition"
                />
                <p className="text-xs text-gray-400 mt-2">
                  El código es válido por 15 minutos
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-brand-orange hover:bg-brand-orange-dk disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-orange-200"
              >
                {loading ? 'Verificando...' : 'Activar cuenta'}
              </button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">
                  <Link to="/register" className="text-brand-blue hover:underline">
                    ¿No recibiste el código? Regístrate de nuevo
                  </Link>
                </p>
                <p className="text-sm text-gray-500">
                  <Link to="/login" className="text-gray-400 hover:underline">
                    Volver al inicio de sesión
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
