import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'

export default function Register() {
  const [form,    setForm]    = useState({ nombre: '', apellido: '', correo: '', contrasena: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)
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
      <div className="min-h-screen bg-gradient-to-br from-[#081e3f] via-brand-blue to-[#1a4faa] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl px-8 py-12 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📧</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">¡Revisa tu correo!</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Enviamos un código de 6 dígitos a tu correo institucional para activar tu cuenta.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 text-brand-blue text-sm">
            <span className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
            <span>Redirigiendo...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#081e3f] via-brand-blue to-[#1a4faa] flex items-center justify-center p-4 overflow-hidden relative">

      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-orange opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-400 opacity-10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          <div className="px-8 pt-8 pb-5 flex flex-col items-center">
            <img src="/logo.jpg" alt="enbUs" className="h-14 object-contain" />
            <p className="text-gray-400 text-xs mt-3 text-center">Solo correos @ucaldas.edu.co</p>
          </div>

          <div className="mx-6 h-px bg-gray-100" />

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Crear cuenta</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombre</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Mariana"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Apellido</label>
                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  placeholder="García"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Correo institucional
              </label>
              <input
                name="correo"
                type="email"
                value={form.correo}
                onChange={handleChange}
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
                  name="contrasena"
                  type={showPass ? 'text' : 'password'}
                  value={form.contrasena}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-orange-dk disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-orange-200/60 active:scale-[0.98]"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creando...</span>
                : 'Crear cuenta'}
            </button>

            <p className="text-center text-sm text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-brand-blue font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-blue-300/50 text-xs mt-6">
          enbUs © 2026 · Universidad de Caldas
        </p>
      </div>
    </div>
  )
}
