// stores/auth.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; nombre: string; apellido: string; correo: string; cuotaRestante: number } | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = ref(false)

  const setAuth = (authData: { token: string; usuario: any }) => {
    token.value = authData.token
    user.value = authData.usuario
    isAuthenticated.value = true
    
    // Almacenar token en localStorage (o cookie si es preferible)
    if (import.meta.client) {
      localStorage.setItem('auth_token', authData.token)
      localStorage.setItem('auth_user', JSON.stringify(authData.usuario))
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    isAuthenticated.value = false
    if (import.meta.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  const loadFromStorage = () => {
    if (import.meta.client) {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')
      if (storedToken && storedUser) {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        isAuthenticated.value = true
      }
    }
  }

  const login = async (correo: string, contrasena: string) => {
    try {
      const { data, error } = await useFetch('/api/auth/login', {
        method: 'POST',
        body: { correo, contrasena }
      })

      if (error.value) {
        throw new Error(error.value.data?.statusMessage || 'Error al iniciar sesión')
      }

      if (data.value) {
        setAuth(data.value as any)
      }
    } catch (err: any) {
      throw err
    }
  }

  const register = async (nombre: string, apellido: string, correo: string, contrasena: string) => {
    try {
      const { data, error } = await useFetch('/api/auth/register', {
        method: 'POST',
        body: { nombre, apellido, correo, contrasena }
      })

      if (error.value) {
        throw new Error(error.value.data?.statusMessage || 'Error al registrar')
      }

      return data.value
    } catch (err: any) {
      throw err
    }
  }
  
  const verifyMfa = async (mfaToken: string) => {
    try {
      const { data, error } = await useFetch(`/api/auth/verify?token=${mfaToken}`)
      if (error.value) {
        throw new Error(error.value.data?.statusMessage || 'Código MFA inválido o expirado')
      }
      return data.value
    } catch (err: any) {
      throw err
    }
  }

  const updateCuota = (nuevaCuota: number) => {
    if (user.value) {
      user.value.cuotaRestante = nuevaCuota
      if (import.meta.client) {
        localStorage.setItem('auth_user', JSON.stringify(user.value))
      }
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    setAuth,
    logout,
    loadFromStorage,
    login,
    register,
    verifyMfa,
    updateCuota
  }
})
