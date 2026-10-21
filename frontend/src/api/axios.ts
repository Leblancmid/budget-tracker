import axios from 'axios'
import { readString, removeItem, STORAGE_KEYS } from '@/lib/storage'
import type { ApiError } from '@/utils/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = readString(STORAGE_KEYS.authToken)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired: drop it and go to the login page (respecting the app's base path)
      removeItem(STORAGE_KEYS.authToken)
      removeItem(STORAGE_KEYS.authUser)
      window.location.href = `${import.meta.env.BASE_URL}login`
    }
    const rejection: ApiError = {
      message: error.response?.data?.message ?? error.message ?? 'An unexpected error occurred.',
      errors:  error.response?.data?.errors,
    }
    return Promise.reject(rejection)
  }
)

export default api
