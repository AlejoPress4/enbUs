import { apiGet, apiPost } from './client'

export const authApi = {
  register: (data)  => apiPost('/auth/register', data),
  login:    (data)  => apiPost('/auth/login', data),
  verify:   (token) => apiGet(`/auth/verify?token=${token}`),
}
