// composables/useQr.ts
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

export const useQr = () => {
  const token = ref<string | null>(null)
  const expiresInSeconds = ref<number>(0)
  const isGenerating = ref(false)
  const error = ref<string | null>(null)
  let timerInterval: any = null

  const authStore = useAuthStore()

  // Formato MM:SS para la cuenta regresiva
  const formattedTime = computed(() => {
    if (expiresInSeconds.value <= 0) return '00:00'
    const mins = Math.floor(expiresInSeconds.value / 60)
    const secs = expiresInSeconds.value % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      if (expiresInSeconds.value > 0) {
        expiresInSeconds.value--
      } else {
        clearInterval(timerInterval)
        token.value = null // Ocultar QR cuando expira
        error.value = 'El código QR ha expirado. Por favor, genera uno nuevo.'
      }
    }, 1000)
  }

  const generateQr = async () => {
    isGenerating.value = true
    error.value = null
    token.value = null
    
    try {
      const { data, error: fetchError } = await useFetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (fetchError.value) {
        throw new Error(fetchError.value.data?.statusMessage || 'Error al generar el código QR')
      }

      if (data.value) {
        const response: any = data.value
        token.value = response.token
        expiresInSeconds.value = response.expiraEnSegundos || 300
        
        // Actualizar cuota restante en el store
        if (response.cuotaRestante !== undefined) {
          authStore.updateCuota(response.cuotaRestante)
        }

        startTimer()
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      isGenerating.value = false
    }
  }

  const clearQr = () => {
    token.value = null
    expiresInSeconds.value = 0
    error.value = null
    if (timerInterval) clearInterval(timerInterval)
  }

  return {
    token,
    expiresInSeconds,
    formattedTime,
    isGenerating,
    error,
    generateQr,
    clearQr
  }
}
