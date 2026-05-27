import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('enbus_token')
    const storedUser  = localStorage.getItem('enbus_user')
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {}
    }
    setLoading(false)
  }, [])

  const login = (authData) => {
    setToken(authData.token)
    setUser(authData.usuario)
    localStorage.setItem('enbus_token', authData.token)
    localStorage.setItem('enbus_user', JSON.stringify(authData.usuario))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('enbus_token')
    localStorage.removeItem('enbus_user')
  }

  const updateCuota = (nuevaCuota) => {
    if (!user) return
    const updated = { ...user, cuotaRestante: nuevaCuota }
    setUser(updated)
    localStorage.setItem('enbus_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, logout, updateCuota }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
