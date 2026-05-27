import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'

export default function Register() {
  const [form,    setForm]    = useState({ nombre: '', apellido: '', correo: '', contrasena: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.register(form)
      setSuccess(true)
      setTimeout(() => navigate('/verify'), 3500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-blue-dark via-brand-blue to-brand-blue-mid flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl px-10 py-12 max-w-sm w-full text-center">
          <span className="text-6xl">📧</span>
          <h2 className="text-2xl font-bold text-brand-blue mt-4">¡Cuenta creada!</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Revisa tu correo institucional. Te enviamos un código de 6 dígitos para activar tu cuenta.
          </p>
          <p className="text-xs text-brand-blue-mid mt-4 animate-pulse">Redirigiendo...</p>
        </div>
      </div>
    )
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
            <h2 className="text-xl font-bold text-white">Crear cuenta nueva</h2>
            <p className="text-blue-300 text-sm mt-0.5">Solo correos @ucaldas.edu.co</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Mariana"
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Apellido</label>
                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  placeholder="García"
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Correo institucional
              </label>
              <input
                name="correo"
                type="email"
                value={form.correo}
                onChange={handleChange}
                placeholder="tu.nombre@ucaldas.edu.co"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                name="contrasena"
                type="password"
                value={form.contrasena}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-orange-dk disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-orange-200 mt-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta nueva'}
            </button>

            <p className="text-center text-sm text-gray-500 pt-1">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-brand-blue font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
