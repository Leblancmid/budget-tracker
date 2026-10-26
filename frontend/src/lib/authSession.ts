import type { AuthUser } from '@/context/auth'
import { readJson, readString, removeItem, STORAGE_KEYS, writeJson, writeString, type StorageArea } from './storage'

export interface AuthSession {
  token: string
  user: AuthUser
  /** ISO time the server stops accepting the token */
  expiresAt: string
}

const AREAS: StorageArea[] = ['local', 'session']

/**
 * Save a login. "Remember me" keeps it in localStorage (survives closing the browser);
 * otherwise it goes in sessionStorage, which the browser clears when it closes.
 */
export function saveSession(session: AuthSession, remember: boolean): void {
  clearSession()
  const area: StorageArea = remember ? 'local' : 'session'
  writeString(STORAGE_KEYS.authToken, session.token, area)
  writeJson(STORAGE_KEYS.authUser, session.user, area)
  writeString(STORAGE_KEYS.authExpiresAt, session.expiresAt, area)
}

/** The saved login, or null when there is none or it has expired (an expired one is removed). */
export function loadSession(now = Date.now()): AuthSession | null {
  for (const area of AREAS) {
    const token = readString(STORAGE_KEYS.authToken, area)
    if (!token) continue

    const user      = readJson<AuthUser | null>(STORAGE_KEYS.authUser, null, area)
    const expiresAt = readString(STORAGE_KEYS.authExpiresAt, area)
    // Logins saved before expiry was tracked have no expiresAt; the server still caps them
    const expired = expiresAt != null && !(Date.parse(expiresAt) > now)

    if (!user || expired) {
      clearSession()
      return null
    }
    return { token, user, expiresAt: expiresAt ?? '' }
  }
  return null
}

/** The token to send with API requests, if any. */
export function sessionToken(): string | null {
  return readString(STORAGE_KEYS.authToken, 'local') ?? readString(STORAGE_KEYS.authToken, 'session')
}

export function clearSession(): void {
  for (const area of AREAS) {
    removeItem(STORAGE_KEYS.authToken, area)
    removeItem(STORAGE_KEYS.authUser, area)
    removeItem(STORAGE_KEYS.authExpiresAt, area)
  }
}

/** Email to pre-fill on the login page (set by a "Remember me" sign-in). */
export const rememberedEmail = () => readString(STORAGE_KEYS.rememberedEmail) ?? ''

export function setRememberedEmail(email: string | null): void {
  if (email) writeString(STORAGE_KEYS.rememberedEmail, email)
  else removeItem(STORAGE_KEYS.rememberedEmail)
}
