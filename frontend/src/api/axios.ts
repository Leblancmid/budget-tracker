import axios from 'axios'
import { clearSession, sessionToken } from '@/lib/authSession'
import type { ApiError } from '@/utils/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = sessionToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const loginPath = `${import.meta.env.BASE_URL}login`

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or revoked: drop it and go to the login page (respecting the app's base path)
      clearSession()
      if (window.location.pathname !== loginPath) window.location.href = loginPath
    }
    const rejection: ApiError = {
      message: error.response?.data?.message ?? error.message ?? 'An unexpected error occurred.',
      errors:  error.response?.data?.errors,
    }
    return Promise.reject(rejection)
  }
)

export default api
