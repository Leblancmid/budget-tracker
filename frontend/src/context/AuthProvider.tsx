import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import api from '@/api/axios'
import { clearSession, loadSession, saveSession, setRememberedEmail, type AuthSession } from '@/lib/authSession'
import { AuthContext, type AuthUser } from './auth'

/** setTimeout can't wait longer than this (~24.8 days); longer waits are re-armed in steps. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1

interface LoginResponse {
  token: string
  expires_at: string
  user: AuthUser
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password, remember })
    const next = { token: data.token, user: data.user, expiresAt: data.expires_at }
    saveSession(next, remember)
    setRememberedEmail(remember ? email.trim() : null)
    setSession(next)
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* the token is dropped either way */ }
    clearSession()
    setSession(null)
  }, [])

  // Sign out when the token expires, even if the app is left open
  useEffect(() => {
    if (!session?.expiresAt) return
    let timer: ReturnType<typeof setTimeout>
    const arm = () => {
      const remaining = Date.parse(session.expiresAt) - Date.now()
      if (remaining <= 0) {
        clearSession()
        setSession(null)
        return
      }
      timer = setTimeout(arm, Math.min(remaining, MAX_TIMEOUT_MS))
    }
    arm()
    return () => clearTimeout(timer)
  }, [session])

  const value = useMemo(() => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    expiresAt: session?.expiresAt || null,
    login,
    logout,
    isAuthenticated: !!session,
  }), [session, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
