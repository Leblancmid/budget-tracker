/**
 * localStorage helpers that never throw: storage can be unavailable (private mode,
 * blocked site data) or hold a value that no longer parses.
 */

/** Every key the app stores, in one place so they can't collide or drift. */
export const STORAGE_KEYS = {
  authToken:           'auth_token',
  authUser:            'auth_user',
  authExpiresAt:       'auth_expires_at',
  /** Email pre-filled on the login page after a "Remember me" sign-in */
  rememberedEmail:     'remembered_email',
  theme:               'theme',
  amountsHidden:       'amounts_hidden',
  sidebarCollapsed:    'sidebar_collapsed',
  lastBalanceAccount:  'tx_last_balance_account',
  /** Gold → ₱ rates on Master → Overview (also used by the sidebar net worth) */
  masterUsdRate:       'master_account_usd_rate',
  masterPhpRate:       'master_account_php_rate',
  /** USD → ₱ rate on Balance */
  balancePhpRate:      'balance_php_rate',
  goldCalculatorRates: 'gold_calculator_rates',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** 'local' survives closing the browser; 'session' is cleared when the browser closes. */
export type StorageArea = 'local' | 'session'

const store = (area: StorageArea): Storage => (area === 'session' ? sessionStorage : localStorage)

export function readString(key: StorageKey, area: StorageArea = 'local'): string | null {
  try {
    return store(area).getItem(key)
  } catch {
    return null
  }
}

export function writeString(key: StorageKey, value: string, area: StorageArea = 'local'): void {
  try {
    store(area).setItem(key, value)
  } catch {
    /* storage unavailable */
  }
}

export function removeItem(key: StorageKey, area: StorageArea = 'local'): void {
  try {
    store(area).removeItem(key)
  } catch {
    /* storage unavailable */
  }
}

/** A saved positive number, or `fallback` when missing, zero or not a number. */
export function readNumber(key: StorageKey, fallback: number): number {
  const v = readString(key)
  return v ? parseFloat(v) || fallback : fallback
}

export function readJson<T>(key: StorageKey, fallback: T, area: StorageArea = 'local'): T {
  const raw = readString(key, area)
  if (raw == null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(key: StorageKey, value: unknown, area: StorageArea = 'local'): void {
  writeString(key, JSON.stringify(value), area)
}
