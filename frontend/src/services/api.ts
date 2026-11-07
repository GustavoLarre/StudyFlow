import { createApiClient } from './apiClient'
import { getIdToken, logout } from './authService'

export const api = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  getToken: getIdToken,
  onUnauthorized: () => { void logout() },
})