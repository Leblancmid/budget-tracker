import { Archive, ArrowLeftRight, Briefcase, Coins, Landmark, LogIn, Pencil, PiggyBank, Plus, Trash2, Undo2, Wallet, type LucideIcon } from 'lucide-react'
import type { LogEntry } from '@/api/logs'

export const PER_PAGE = 30

export type ModuleKey = LogEntry['module'] | 'all'
export type UserFilterKey = 'all' | number
export type EventKey = 'all' | 'created' | 'edited' | 'archived' | 'removed' | 'access'

export const MODULE_STYLES: Record<LogEntry['module'], { Icon: LucideIcon; tile: string; badge: string; bar: string; label: string }> = {
  daily:    { Icon: Wallet,         tile: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',    bar: 'bg-indigo-400',  label: 'Daily' },
  business: { Icon: Briefcase,      tile: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300',            badge: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',            bar: 'bg-teal-400',    label: 'Business' },
  savings:  { Icon: PiggyBank,      tile: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', bar: 'bg-emerald-400', label: 'Savings' },
  balance:  { Icon: Landmark,       tile: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300',    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',    bar: 'bg-violet-400',  label: 'Balance' },
  gold:     { Icon: Coins,          tile: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',        bar: 'bg-amber-400',   label: 'Gold' },
  access:   { Icon: LogIn,          tile: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300',               badge: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',               bar: 'bg-sky-400',     label: 'Accounts' },
  system:   { Icon: Undo2,          tile: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',           badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',           bar: 'bg-slate-400',   label: 'Undo' },
  trade:    { Icon: ArrowLeftRight, tile: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300',            badge: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',            bar: 'bg-rose-400',    label: 'Trades' },
}
export const MODULE_ORDER: LogEntry['module'][] = ['daily', 'business', 'balance', 'gold', 'trade', 'savings', 'access', 'system']

export const TYPE_LABEL: Record<string, string> = {
  income: 'Income', expense: 'Expense',
  deposit: 'Deposit', withdraw: 'Withdraw',
  add: 'Add', sell: 'Sell', fee: 'MM fee',
  account: 'Account', gold: 'Gold',
  kks: 'KKS', cash: 'Cash',
  archived: 'Sold / archived', edited: 'Edited',
  payment: 'Payment', removed: 'Removed', added: 'Added',
  signed_in: 'Signed in', signed_out: 'Signed out', signed_out_all: 'Signed out everywhere',
  sign_in_failed: 'Failed sign-in', locked_out: 'Locked out',
  undone: 'Undone', redone: 'Redone', published: 'Published',
}

/** Done by this person, or about their account (a failed sign-in with their email) */
export const isAbout = (e: LogEntry, userId: number) => e.user_id === userId || (e.user_id === null && e.about_user_id === userId)

/** Sign-ins, sign-outs, failed sign-ins and lockouts */
export const ACCESS_TYPES = ['signed_in', 'signed_out', 'signed_out_all', 'sign_in_failed', 'locked_out']
/** A sign-in that didn't get through */
export const isDeniedAccess = (e: LogEntry) => e.type === 'sign_in_failed' || e.type === 'locked_out'

export const eventOf = (e: LogEntry): Exclude<EventKey, 'all'> =>
  ACCESS_TYPES.includes(e.type) ? 'access'
    : e.type === 'edited' || e.type === 'undone' || e.type === 'redone' ? 'edited'
    : e.type === 'archived' ? 'archived'
    : e.type === 'removed' ? 'removed'
    : 'created'

export type ValueKind = 'gold' | 'php' | 'usd' | 'rate' | 'date' | 'text'

const FIELD_META: Record<string, { label: string; kind: ValueKind }> = {
  description:         { label: 'Description',      kind: 'text' },
  notes:               { label: 'Notes',            kind: 'text' },
  type:                { label: 'Type',             kind: 'text' },
  scope:               { label: 'Counts toward',    kind: 'text' },
  action:              { label: 'Action',           kind: 'text' },
  status:              { label: 'Status',           kind: 'text' },
  currency:            { label: 'Currency',         kind: 'text' },
  payment_method:      { label: 'Payment Method',   kind: 'text' },
  account:             { label: 'Account',          kind: 'text' },
  account_id:          { label: 'Account',          kind: 'text' },
  category_id:         { label: 'Category',         kind: 'text' },
  date:                { label: 'Date',             kind: 'date' },
  completion_date:     { label: 'Completion Date',  kind: 'date' },
  archived_at:         { label: 'Sold / Archived',  kind: 'date' },
  price_gold:          { label: 'Price (G)',        kind: 'gold' },
  cost_gold:           { label: 'Cost (G)',         kind: 'gold' },
  price_gold_received: { label: 'Received (G)',     kind: 'gold' },
  cost_gold_paid:      { label: 'Paid (G)',         kind: 'gold' },
  price_rate:          { label: 'Price Rate ($)',   kind: 'rate' },
  cost_rate:           { label: 'Cost Rate ($)',    kind: 'rate' },
  php_rate:            { label: 'PHP Rate (Price)', kind: 'rate' },
  cost_php_rate:       { label: 'PHP Rate (Cost)',  kind: 'rate' },
  price_php:           { label: 'Price (₱)',        kind: 'php' },
  cost_php:            { label: 'Cost (₱)',         kind: 'php' },
  profit_php:          { label: 'Profit (₱)',       kind: 'php' },
  middleman_fee:       { label: 'Middleman Fee',    kind: 'gold' },
}

/** Kind of the `amount` field: G for gold, the account's currency for balance, ₱ otherwise. */
export function amountKind(e: LogEntry): ValueKind {
  if (e.module === 'gold')    return 'gold'
  if (e.module === 'balance') return e.currency === 'PHP' ? 'php' : 'usd'
  if (e.module === 'trade')   return 'text'
  return 'php'
}

export function fieldMeta(field: string, e: LogEntry): { label: string; kind: ValueKind } {
  if (field === 'amount') return { label: 'Amount', kind: amountKind(e) }
  return FIELD_META[field] ?? { label: field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), kind: 'text' }
}

export function formatValue(value: unknown, kind: ValueKind): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  const money = (v: number) => v.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  switch (kind) {
    case 'gold': return Number.isFinite(n) ? `${Math.round(n).toLocaleString()} G` : String(value)
    case 'php':  return Number.isFinite(n) ? `₱${money(n)}` : String(value)
    case 'usd':  return Number.isFinite(n) ? `$${money(n)}` : String(value)
    case 'rate': return Number.isFinite(n) ? String(Math.round(n * 10000) / 10000) : String(value)
    case 'date': {
      const d = new Date(String(value).length <= 10 ? `${value}T00:00:00` : String(value))
      return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    default: return String(value)
  }
}

export function isPositiveEntry(e: LogEntry): boolean {
  // A record added (a budget, an MM fee…) isn't money in or out
  if (e.type === 'added')      return true
  if (e.module === 'daily')    return e.type === 'income'
  if (e.module === 'savings')  return e.type === 'deposit'
  if (e.module === 'balance')  return e.type === 'add'
  if (e.module === 'gold')     return e.type === 'add' || e.type === 'fee'
  if (e.module === 'business') return parseFloat(e.amount ?? '0') >= 0
  return true
}

export function formatAmount(e: LogEntry): string {
  if (e.amount == null) return '—'
  const n = Math.abs(parseFloat(e.amount))
  const kind = amountKind(e)
  if (kind === 'text') return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return formatValue(n, kind)
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatTimeOnly = (iso: string) => new Date(iso).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true })
export const formatDateTime = (iso: string) => new Date(iso).toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

export function dayLabel(d: Date): string {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const x = new Date(d); x.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - x.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function detectDevice(ua: string | null): 'mobile' | 'desktop' | null {
  if (!ua) return null
  return /mobile|android|iphone|ipad|tablet/i.test(ua) ? 'mobile' : 'desktop'
}

export const EVENT_FILTERS = [
  { key: 'all',      label: 'All events',      Icon: null },
  { key: 'created',  label: 'Created',         Icon: Plus },
  { key: 'edited',   label: 'Edited',          Icon: Pencil },
  { key: 'archived', label: 'Sold / archived', Icon: Archive },
  { key: 'removed',  label: 'Removed',         Icon: Trash2 },
  { key: 'access',   label: 'Sign-ins',        Icon: LogIn },
] as const

export interface LogSummary {
  todayCount: number
  weekCount: number
  edits: number
  /** [module, count] of the busiest module */
  top: [string, number] | undefined
  days: { key: string; date: Date; count: number }[]
  dayMax: number
}

/** Activity counts for the current user filter, with a 14-day chart. */
export function summarizeLogs(entries: LogEntry[]): LogSummary {
  const now = Date.now()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let todayCount = 0, weekCount = 0, edits = 0
  const perModule: Record<string, number> = {}
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - 13 + i)
    return { key: d.toDateString(), date: d, count: 0 }
  })
  const dayMap = new Map(days.map((d) => [d.key, d]))
  for (const e of entries) {
    const t = new Date(e.created_at)
    if (t >= today) todayCount++
    if (now - t.getTime() < 7 * 86400000) weekCount++
    if (e.type === 'edited') edits++
    perModule[e.module] = (perModule[e.module] ?? 0) + 1
    const d = dayMap.get(t.toDateString())
    if (d) d.count++
  }
  const top = Object.entries(perModule).sort((a, b) => b[1] - a[1])[0]
  return { todayCount, weekCount, edits, top, days, dayMax: Math.max(1, ...days.map((d) => d.count)) }
}
