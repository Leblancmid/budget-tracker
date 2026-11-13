import { createContext, useContext } from 'react'

export type UserRole = 'admin' | 'trader' | 'daily_only'

/** Parts of the app access is given for (see lib/access) */
export type Module = 'daily' | 'trading' | 'storefront' | 'wallets' | 'master'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  /** What they can open (absent on logins saved before modules existed: see lib/access) */
  modules?: Module[]
  /** Profile picture (absent on logins saved before profiles existed) */
  avatar_url?: string | null
  created_at?: string | null
}

export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  /** ISO time this login stops working (null for logins saved before expiry was tracked) */
  expiresAt: string | null
  login: (email: string, password: string, remember: boolean) => Promise<void>
  logout: () => Promise<void>
  /** Show changes to your own account (name, email, picture) everywhere, and keep them for next time. */
  updateUser: (user: AuthUser) => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
