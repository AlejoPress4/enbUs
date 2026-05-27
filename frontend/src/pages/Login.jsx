import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [correo,     setCorreo]     = useState('')
  const [contrasena, setContrasena] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [showPass,   setShowPass]   = useState(false)

  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await authApi.login({ correo, contrasena })
      login(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#081e3f] via-brand-blue to-[#1a4faa] flex items-center justify-center p-4 overflow-hidden relative">

      {/* Decorative orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-orange opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-400 opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white opacity-[0.03] rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Logo header */}
          <div className="px-8 pt-8 pb-5 flex flex-col items-center">
            <img src="/logo.jpg" alt="enbUs" className="h-14 object-contain" />
            <p className="text-gray-400 text-xs mt-3 text-center">
              Tarifa diferencial estudiantil · Manizales
            </p>
          </div>

          <div className="mx-6 h-px bg-gray-100" />

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Iniciar sesión</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Correo institucional
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tu.nombre@ucaldas.edu.co"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-11 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                  >
                    {showPass ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-orange-dk disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-orange-200/60 active:scale-[0.98] mt-2"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Ingresando...</span>
                : 'Ingresar'}
            </button>

            <div className="space-y-2 pt-1">
              <p className="text-center text-sm text-gray-500">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-brand-blue font-semibold hover:underline">
                  Regístrate
                </Link>
              </p>
              <p className="text-center text-xs text-gray-400">
                <Link to="/verify" className="hover:text-brand-blue transition-colors">
                  Activar cuenta con código
                </Link>
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-blue-300/50 text-xs mt-6">
          enbUs © 2026 · Universidad de Caldas
        </p>
      </div>
    </div>
  )
}
