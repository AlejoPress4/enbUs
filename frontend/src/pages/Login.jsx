import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [correo,    setCorreo]    = useState('')
  const [contrasena, setContrasena] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

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
    <div className="min-h-screen bg-gradient-to-br from-brand-blue-dark via-brand-blue to-brand-blue-mid flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-6xl">🚌</span>
          <h1 className="text-4xl font-extrabold text-white mt-3 tracking-tight">
            en<span className="text-brand-orange">Bus</span>
          </h1>
          <p className="text-blue-300 mt-1 text-sm">Tarifa Diferencial Estudiantil · Manizales</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-brand-blue px-8 py-5">
            <h2 className="text-xl font-bold text-white">Iniciar sesión</h2>
            <p className="text-blue-300 text-sm mt-0.5">Accede con tu correo institucional</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Correo institucional
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tu.nombre@ucaldas.edu.co"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-orange-dk disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-orange-200 active:scale-95"
            >
              {loading ? 'Ingresando...' : 'Entrar'}
            </button>

            <p className="text-center text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-brand-blue font-semibold hover:underline">
                Regístrate aquí
              </Link>
            </p>
            <p className="text-center text-sm text-gray-400">
              ¿Tienes un código de activación?{' '}
              <Link to="/verify" className="text-brand-blue-mid hover:underline">
                Activar cuenta
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
