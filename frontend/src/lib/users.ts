import type { UserRole } from '@/context/auth'

/**
 * What user accounts mean, in one place: role names, the one-line status, device names, initials
 * and avatar colours, and the password rules (the same ones the server enforces).
 */

export const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Everything: business, Rucoy, Master File and users' },
  { value: 'daily_only', label: 'Daily Expenses only', description: 'Only their own expenses, budgets and report' },
]

export const roleLabel = (role: UserRole) => ROLES.find((r) => r.value === role)?.label ?? role

/** "MA" for "Michael Adriane Nabong", "B" for "Ben", "?" for nothing. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** Gradients for initials avatars: the same person always gets the same one. */
const GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-400',
  'from-fuchsia-500 to-purple-500',
]
export const avatarGradient = (seed: number) => GRADIENTS[Math.abs(seed) % GRADIENTS.length]

/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", or a date. */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string | null {
  if (!iso) return null
  const ms = now - Date.parse(iso)
  if (Number.isNaN(ms)) return null
  const min = Math.floor(ms / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d} days ago`
  return new Date(iso).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' })
}

/** One plain sentence about an account: "Active · seen 5 min ago", "Never signed in", "Deactivated". */
export function userStatus(u: { deactivated_at: string | null; last_active_at: string | null }, now = Date.now()): { text: string; tone: 'active' | 'idle' | 'off' } {
  if (u.deactivated_at) return { text: 'Deactivated · can\'t sign in', tone: 'off' }
  const seen = timeAgo(u.last_active_at, now)
  if (!seen) return { text: 'Never signed in', tone: 'idle' }
  return { text: `Active · seen ${seen}`, tone: 'active' }
}

/** "Chrome on Windows", "Safari on iPhone"… from a browser's user agent. */
export function deviceName(userAgent: string): string {
  const ua = userAgent || ''
  const os = /iPhone/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) ? 'iPad'
    : /Android/.test(ua) ? 'Android'
    : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua) ? 'Mac'
    : /Linux/.test(ua) ? 'Linux'
    : null
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /Firefox\/|FxiOS/.test(ua) ? 'Firefox'
    : /Chrome\/|CriOS/.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : null
  if (browser && os) return `${browser} on ${os}`
  return browser ?? os ?? (ua.slice(0, 40) || 'Unknown device')
}

export const isPhone = (userAgent: string) => /iPhone|Android|Mobile/.test(userAgent)

/** The password rules, checked as you type (the server checks the same). */
export function passwordChecks(pw: string): { label: string; ok: boolean }[] {
  return [
    { label: '10+ characters', ok: pw.length >= 10 },
    { label: 'Upper & lower case', ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { label: 'A number', ok: /\d/.test(pw) },
  ]
}

export const passwordOk = (pw: string) => passwordChecks(pw).every((c) => c.ok)

/** 0–4 for the strength bar: the rules met, plus one for length 14+ or a symbol. */
export function passwordStrength(pw: string): number {
  if (!pw) return 0
  const met = passwordChecks(pw).filter((c) => c.ok).length
  const bonus = pw.length >= 14 || /[^A-Za-z0-9]/.test(pw) ? 1 : 0
  return Math.min(4, met + (met === 3 ? bonus : 0))
}

export const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'] as const

/** A random password that meets the rules (for a new user's first sign-in). */
export function generatePassword(length = 14, random: (n: number) => number = cryptoInt): string {
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const digits = '23456789'
  const all = lower + upper + digits
  const pick = (set: string) => set[random(set.length)]
  const chars = [pick(lower), pick(upper), pick(digits)]
  while (chars.length < length) chars.push(pick(all))
  // Shuffle so the required characters aren't always first
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

function cryptoInt(n: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % n
}
