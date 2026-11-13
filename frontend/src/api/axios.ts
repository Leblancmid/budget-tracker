import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { clearSession, loadSession, sessionToken } from '@/lib/authSession'
import { newClientId } from '@/lib/offline/clientId'
import { emitSavedOffline } from '@/lib/offline/offlineEvents'
import { getOfflineStatus, markOffline, markOnline } from '@/lib/offline/offlineStatus'
import { responseKey, saveResponse, savedResponse } from '@/lib/offline/responseCache'
import { muteErrorToasts, toast } from '@/lib/toast'
import type { ApiError } from '@/utils/api'

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * false: without a connection, fail instead of keeping the change for later (Daily Expenses
     * keeps its own; the outbox's own sends must never be kept again)
     */
    offlineQueue?: boolean
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

/** A page's data that takes longer than this counts as "no connection" (the saved copy shows instead). */
export const READ_TIMEOUT_MS = 15_000
/**
 * A change that gets no answer in this time is kept on the device instead of leaving the form
 * spinning (a weak signal or a dropped VPN can otherwise hang for a minute or more). Uploads get longer.
 */
export const WRITE_TIMEOUT_MS = 12_000
export const UPLOAD_TIMEOUT_MS = 60_000
/** Once a request has already found no connection, the next ones give up sooner (until one gets through). */
export const OFFLINE_TIMEOUT_MS = 4_000

/** The phone itself says there's no network: don't wait for a request that can't go anywhere. */
const deviceOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

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

// ── Changes made offline ─────────────────────────────────────────────────────────────────────────
export interface OfflineWrite {
  method: string
  url: string
  data: unknown
  /** The Idempotency-Key the first try was sent with */
  key?: string
}

/** Changes that only make sense with a connection: signing in/out, undo/redo, publishing to the website. */
// Accounts (your profile, user management) change who can sign in: never queued, always sent now
const NEEDS_CONNECTION = [/^\/auth\//, /^\/profile(\/|$)/, /^\/users(\/|$)/, /^\/master\/operations\//, /^\/business\/listing\/publish/]

export const keepsOffline = (config: AxiosRequestConfig) =>
  (config.method ?? 'get').toLowerCase() !== 'get'
  && config.offlineQueue !== false
  && !NEEDS_CONNECTION.some((p) => p.test(config.url ?? ''))

let keepWrite: ((write: OfflineWrite) => Promise<unknown>) | null = null

/** Where changes made offline are kept (the outbox registers itself). */
export function onOfflineWrite(fn: (write: OfflineWrite) => Promise<unknown>): void {
  keepWrite = fn
}

/** Shown when a change is kept on the device. */
export const SAVED_OFFLINE_MESSAGE = 'You\'re offline: saved on this device. You\'ll be asked to approve sending it when you\'re back online.'

api.interceptors.request.use((config) => {
  const token = sessionToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  const isRead = (config.method ?? 'get').toLowerCase() === 'get'
  // A hung connection (e.g. the VPN dropped) shouldn't leave a page loading, or a save spinning, forever
  const upload = config.data instanceof FormData
  if (!config.timeout) {
    config.timeout = getOfflineStatus().offline && !upload ? OFFLINE_TIMEOUT_MS
      : isRead ? READ_TIMEOUT_MS : upload ? UPLOAD_TIMEOUT_MS : WRITE_TIMEOUT_MS
  }
  // Every change carries a key, so if it times out after all reaching the server, the copy kept on
  // the device (sent later with the same key) isn't done a second time
  // (only changes that can be kept: never sign-in, whose answer holds a token)
  if (keepsOffline(config) && !config.headers['Idempotency-Key']) config.headers['Idempotency-Key'] = newClientId()
  // No network at all: fail straight away, like a request that got no answer (handled below)
  if (deviceOffline()) return Promise.reject(Object.assign(new Error('Network Error'), { config, isAxiosError: true, code: 'ERR_NETWORK' }))
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

      // A change: kept on the device until you approve sending it. The form closes like after a
      // save; the page's own "couldn't save" message is muted (this one says what happened).
      if (config && keepWrite && keepsOffline(config)) {
        try {
          const key = config.headers?.['Idempotency-Key']
          await keepWrite({ method: config.method ?? 'post', url: config.url ?? '', data: config.data, key: typeof key === 'string' ? key : undefined })
          toast.success(SAVED_OFFLINE_MESSAGE)
          muteErrorToasts(1500)
          emitSavedOffline()
          return Promise.reject({ message: '', offline: true, queued: true } satisfies ApiError)
        } catch (err) {
          return Promise.reject({ message: (err as ApiError)?.message || 'Couldn\'t keep this change on the device.', offline: true } satisfies ApiError)
        }
      }

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
