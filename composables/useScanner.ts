// composables/useScanner.ts
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

export const useScanner = () => {
  const isScanning = ref(false)
  const isProcessing = ref(false)
  const lastResult = ref<{
    success: boolean
    message: string
    usuario?: any
    buseta?: any
    cuotaRestante?: number
  } | null>(null)
  
  const authStore = useAuthStore()

  // Esta función debe ser llamada cuando la cámara (ej. html5-qrcode) detecte un código QR
  const processQrScanned = async (qrToken: string, lectorSerie: string) => {
    if (isProcessing.value) return // Evitar escaneos duplicados en ráfaga
    
    isProcessing.value = true
    lastResult.value = null

    try {
      const { data, error } = await useFetch('/api/qr/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        },
        body: {
          token: qrToken,
          lectorSerie: lectorSerie // Este número debe estar configurado en la buseta
        }
      })

      if (error.value) {
        // Manejar errores de servidor (400, 403, 500) que lanza createError en H3
        lastResult.value = {
          success: false,
          message: error.value.data?.statusMessage || 'Error al validar el código QR'
        }
        // Emitir sonido de error (beep largo)
        playAudioFeedback(false)
      } else if (data.value) {
        const response: any = data.value
        lastResult.value = {
          success: response.success,
          message: response.message || (response.success ? 'Pasaje aprobado' : 'Pasaje rechazado'),
          usuario: response.usuario,
          buseta: response.buseta,
          cuotaRestante: response.cuotaRestante
        }
        
        // Emitir sonido correspondiente
        playAudioFeedback(response.success)
      }
    } catch (err: any) {
      lastResult.value = {
        success: false,
        message: err.message || 'Error inesperado al conectar con el servidor'
      }
      playAudioFeedback(false)
    } finally {
      // Pequeño delay para evitar que escanee el mismo código inmediatamente
      setTimeout(() => {
        isProcessing.value = false
      }, 2000)
    }
  }

  // Utilidad simple para sonido
  const playAudioFeedback = (success: boolean) => {
    if (!import.meta.client) return
    
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      
      if (success) {
        // Sonido de éxito (bip agudo corto)
        oscillator.type = 'sine'
        oscillator.frequency.value = 800
        gainNode.gain.setValueAtTime(1, context.currentTime)
        oscillator.start()
        oscillator.stop(context.currentTime + 0.2)
      } else {
        // Sonido de error (bip grave y un poco más largo)
        oscillator.type = 'sawtooth'
        oscillator.frequency.value = 200
        gainNode.gain.setValueAtTime(1, context.currentTime)
        oscillator.start()
        oscillator.stop(context.currentTime + 0.5)
      }
    } catch (e) {
      console.warn('No se pudo reproducir audio feedback:', e)
    }
  }

  return {
    isScanning,
    isProcessing,
    lastResult,
    processQrScanned
  }
}
