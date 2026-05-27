import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLink = (to, label) => {
    const active = pathname === to
    return (
      <Link
        to={to}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-brand-orange text-white shadow'
            : 'text-blue-200 hover:text-white hover:bg-brand-blue-mid'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-brand-blue shadow-lg">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <span className="text-2xl">🚌</span>
            <span className="text-white font-extrabold text-xl tracking-tight">
              en<span className="text-brand-orange">Bus</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-2">
            {navLink('/dashboard', 'Mi Pasaje')}
            {navLink('/scanner', 'Scanner')}
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-white text-sm font-semibold leading-none">
                  {user.nombre} {user.apellido}
                </span>
                <span className="text-brand-orange text-xs font-medium mt-0.5">
                  {user.cuotaRestante} pasaje{user.cuotaRestante !== 1 ? 's' : ''} disponible{user.cuotaRestante !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-blue-200 hover:text-white border border-blue-600 hover:border-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-all"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
