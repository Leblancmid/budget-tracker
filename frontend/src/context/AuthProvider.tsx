import { useCallback, useMemo, useState, type ReactNode } from 'react'
import api from '@/api/axios'
import { readJson, readString, removeItem, STORAGE_KEYS, writeJson, writeString } from '@/lib/storage'
import { AuthContext, type AuthUser } from './auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readString(STORAGE_KEYS.authToken))
  const [user,  setUser]  = useState<AuthUser | null>(() => readJson<AuthUser | null>(STORAGE_KEYS.authUser, null))

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password })
    writeString(STORAGE_KEYS.authToken, data.token)
    writeJson(STORAGE_KEYS.authUser, data.user)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* the token is dropped either way */ }
    removeItem(STORAGE_KEYS.authToken)
    removeItem(STORAGE_KEYS.authUser)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, login, logout, isAuthenticated: !!token }),
    [user, token, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
