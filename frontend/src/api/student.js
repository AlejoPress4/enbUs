import { apiGet } from './client'

export const studentApi = {
  dashboard: () => apiGet('/student/dashboard'),
}
