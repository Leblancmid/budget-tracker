import type { AuthUser, Module, UserRole } from '@/context/auth'

/**
 * Who can open what, in one place (the server checks the same; this only decides what to show).
 * Daily Expenses (your own entries) is everyone's. The rest is given per person: by their role, or
 * module by module by an admin.
 */
export const MODULES: { value: Module; label: string; description: string; locked?: boolean }[] = [
  { value: 'daily', label: 'Daily Expenses', description: 'Their own expenses, budgets and report', locked: true },
  { value: 'trading', label: 'Trading', description: 'Business and Rucoy: sales, listings, leads, gold and trades' },
  { value: 'wallets', label: 'Wallets', description: 'The Balance page, and linking entries to a wallet' },
  { value: 'master', label: 'Master File', description: 'Net worth overview, plus the logs and undo of what they did' },
]

/** What each role gets unless an admin picks modules for that person. */
export const PRESETS: Record<UserRole, Module[]> = {
  admin: ['daily', 'trading', 'wallets', 'master'],
  trader: ['daily', 'trading'],
  daily_only: ['daily'],
}

export const isAdmin = (user: Pick<AuthUser, 'role'> | null | undefined) => user?.role === 'admin'

/** The modules this person can open (logins saved before modules existed: from their role). */
export function modulesOf(user: Pick<AuthUser, 'role' | 'modules'> | null | undefined): Module[] {
  if (!user) return []
  if (user.role === 'admin') return PRESETS.admin
  return user.modules ?? PRESETS[user.role] ?? ['daily']
}

export const can = (user: Pick<AuthUser, 'role' | 'modules'> | null | undefined, module: Module) => modulesOf(user).includes(module)

/** True when this person's modules differ from what their role gives. */
export function isCustom(user: Pick<AuthUser, 'role' | 'modules'>): boolean {
  if (user.role === 'admin') return false
  const preset = PRESETS[user.role]
  const mine = modulesOf(user)
  return mine.length !== preset.length || mine.some((m) => !preset.includes(m))
}

/** "Trading, Wallets": the modules beyond Daily Expenses, for a list. */
export function extraModules(user: Pick<AuthUser, 'role' | 'modules'>): string {
  return MODULES.filter((m) => m.value !== 'daily' && can(user, m.value)).map((m) => m.label).join(', ')
}
