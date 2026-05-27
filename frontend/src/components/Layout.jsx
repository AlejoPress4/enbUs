import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const IconTicket = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
    <line x1="13" y1="5" x2="13" y2="7"/>
    <line x1="13" y1="11" x2="13" y2="13"/>
    <line x1="13" y1="17" x2="13" y2="19"/>
  </svg>
)

const IconScan = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
  </svg>
)

const IconLogout = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
)

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path) => pathname === path

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">

      {/* Top Header */}
      <header className="bg-brand-blue fixed top-0 left-0 right-0 z-30 shadow-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">

          <Link to="/dashboard" className="text-xl font-extrabold text-white tracking-tight select-none">
            en<span className="text-brand-orange">Bus</span>
          </Link>

          <div className="flex items-center gap-2.5">
            {user && (
              <>
                <span className="bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-xs font-bold px-2.5 py-1 rounded-full">
                  {user.cuotaRestante} {user.cuotaRestante === 1 ? 'pasaje' : 'pasajes'}
                </span>
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center ring-2 ring-white/20">
                  <span className="text-white text-sm font-bold">
                    {user.nombre?.[0]?.toUpperCase()}
                  </span>
                </div>
              </>
            )}
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center rounded-full text-blue-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Cerrar sesión"
            >
              <IconLogout className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-20 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
        <div className="max-w-lg mx-auto flex">

          <Link
            to="/dashboard"
            className={`flex-1 relative flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              isActive('/dashboard') ? 'text-brand-orange' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <IconTicket className="w-6 h-6" />
            <span className="text-xs font-semibold">Mi Pasaje</span>
            {isActive('/dashboard') && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 bg-brand-orange rounded-b-full" />
            )}
          </Link>

          <Link
            to="/scanner"
            className={`flex-1 relative flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              isActive('/scanner') ? 'text-brand-orange' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <IconScan className="w-6 h-6" />
            <span className="text-xs font-semibold">Scanner</span>
            {isActive('/scanner') && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 bg-brand-orange rounded-b-full" />
            )}
          </Link>

        </div>
      </nav>
    </div>
  )
}
