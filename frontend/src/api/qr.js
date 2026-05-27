import { apiPost } from './client'

export const qrApi = {
  generate: ()                          => apiPost('/qr/generate'),
  validate: (token, lectorSerie)        => apiPost('/qr/validate', { token, lectorSerie }),
}
