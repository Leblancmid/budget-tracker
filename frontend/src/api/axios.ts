import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { clearSession, loadSession, sessionToken } from '@/lib/authSession'
import { markOffline, markOnline } from '@/lib/offline/offlineStatus'
import { responseKey, saveResponse, savedResponse } from '@/lib/offline/responseCache'
import type { ApiError } from '@/utils/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

/** A page's data that takes longer than this counts as "no connection" (the saved copy shows instead). */
export const READ_TIMEOUT_MS = 15_000

/**
 * Reads that are kept on the device for offline viewing: JSON GETs, except login/logout.
 * Returns the storage key, or null for requests that aren't kept.
 */
export function offlineKey(config: AxiosRequestConfig): string | null {
  if ((config.method ?? 'get').toLowerCase() !== 'get') return null
  if (config.responseType && config.responseType !== 'json') return null
  if (config.url?.startsWith('/auth/')) return null
  const userId = loadSession()?.user.id
  if (userId == null) return null
  return responseKey(userId, api.getUri(config))
}

/** No answer from the server at all (offline, server unreachable, timed out), as opposed to an error reply. */
export const isConnectionError = (error: { response?: unknown }) => !error.response

api.interceptors.request.use((config) => {
  const token = sessionToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  // A hung connection (e.g. the VPN dropped) shouldn't leave a page loading forever
  if ((config.method ?? 'get').toLowerCase() === 'get' && !config.timeout) config.timeout = READ_TIMEOUT_MS
  return config
})

const loginPath = `${import.meta.env.BASE_URL}login`

api.interceptors.response.use(
  (response) => {
    markOnline()
    const key = offlineKey(response.config)
    if (key) void saveResponse(key, response.data)
    return response
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Session expired or revoked: drop it and go to the login page (respecting the app's base path)
      clearSession()
      if (window.location.pathname !== loginPath) window.location.href = loginPath
    }

    if (isConnectionError(error) && !axios.isCancel(error)) {
      const config = error.config as InternalAxiosRequestConfig | undefined
      const key = config ? offlineKey(config) : null
      const saved = key ? await savedResponse(key) : undefined
      if (saved && config) {
        // Offline: show what this page showed last time
        markOffline(saved.savedAt)
        return { data: saved.data, status: 200, statusText: 'Saved copy', headers: {}, config } satisfies AxiosResponse
      }
      markOffline()
      const rejection: ApiError = {
        message: key
          ? 'You\'re offline, and this page hasn\'t been opened on this device yet.'
          : 'You\'re offline. This needs an internet connection.',
        offline: true,
      }
      return Promise.reject(rejection)
    }

    const rejection: ApiError = {
      message: error.response?.data?.message ?? error.message ?? 'An unexpected error occurred.',
      errors:  error.response?.data?.errors,
      status:  error.response?.status,
    }
    return Promise.reject(rejection)
  }
)

export default api
