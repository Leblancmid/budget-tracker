import { ArrowLeftRight, Coins, HandCoins, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import type { GoldLog, Trade } from '@/types'

export type UnifiedEntry =
  | { kind: 'log'; log: GoldLog; date: string }
  | { kind: 'trade'; trade: Trade; date: string }

export type TypeFilter = 'all' | 'add' | 'sell' | 'fee' | 'kks' | 'cash'
export type EntryType = Exclude<TypeFilter, 'all'>
export type MmFeePeriod = 'today' | 'last_month' | 'monthly' | 'yearly' | 'total'

export const TYPE_FILTERS: TypeFilter[] = ['all', 'add', 'sell', 'fee', 'kks', 'cash']

export const ENTRY_STYLE: Record<EntryType, { label: string; Icon: LucideIcon; tile: string; pill: string }> = {
  add:  { label: 'Add',    Icon: TrendingUp,     tile: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400', pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  sell: { label: 'Sell',   Icon: TrendingDown,   tile: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',                 pill: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  fee:  { label: 'MM Fee', Icon: HandCoins,      tile: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',     pill: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  kks:  { label: 'KKS',    Icon: Coins,          tile: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',         pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  cash: { label: 'Cash',   Icon: ArrowLeftRight, tile: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400',             pill: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
}

export const MM_FEE_PERIODS: MmFeePeriod[] = ['today', 'monthly', 'last_month', 'yearly', 'total']

export const MM_FEE_PERIOD_LABEL: Record<MmFeePeriod, string> = {
  today: 'Today', last_month: 'Last month', monthly: 'This month', yearly: 'This year', total: 'All time',
}

export const fmtG = (n: number) => `${Math.round(n).toLocaleString()} G`

/** Compact G for chart labels: 1.2B, 350M, 12k. */
export const shortG = (n: number) => {
  const a = Math.abs(n)
  return a >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : a >= 1e6 ? `${(n / 1e6).toFixed(0)}M` : a >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : String(Math.round(n))
}

/** Signed effect of a gold log on the stash (cancelled entries count as 0). */
export function logDelta(log: GoldLog): number {
  if (log.cancelled_at) return 0
  const amt = Number(log.amount)
  return log.type === 'add' || log.type === 'fee' ? amt : -Math.abs(amt)
}

export const typeOfEntry = (e: UnifiedEntry): EntryType =>
  e.kind === 'trade' ? (e.trade.status === 'kks' ? 'kks' : 'cash') : (e.log.type === 'add' ? 'add' : e.log.type === 'fee' ? 'fee' : 'sell')

/** Middleman fees (not cancelled) received in the period. */
export function mmFeeTotal(logs: GoldLog[], period: MmFeePeriod, now = new Date()): number {
  return logs
    .filter((l) => l.type === 'fee' && !l.cancelled_at)
    .filter((l) => {
      const d = new Date(l.created_at)
      if (period === 'today') return d.toDateString() === now.toDateString()
      if (period === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear()
      }
      if (period === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      if (period === 'yearly') return d.getFullYear() === now.getFullYear()
      return true
    })
    .reduce((sum, l) => sum + parseFloat(l.amount), 0)
}

export interface GoldFlow {
  added: number
  sold: number
  fees: number
  net: number
  /** Daily in/out for the last 30 days, oldest first */
  days: { key: string; label: Date; inflow: number; outflow: number }[]
}

/** This month's totals plus daily in/out for the last 30 days. */
export function goldFlow(logs: GoldLog[], now = new Date()): GoldFlow {
  let added = 0, sold = 0, fees = 0
  for (const l of logs) {
    if (l.cancelled_at) continue
    const d = new Date(l.created_at)
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue
    const amt = Number(l.amount)
    if (l.type === 'add') added += amt
    else if (l.type === 'fee') fees += amt
    else sold += Math.abs(amt)
  }
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29 + i)
    return { key: d.toDateString(), label: d, inflow: 0, outflow: 0 }
  })
  const byKey = new Map(days.map((d) => [d.key, d]))
  for (const l of logs) {
    const day = byKey.get(new Date(l.created_at).toDateString())
    if (!day) continue
    const delta = logDelta(l)
    if (delta >= 0) day.inflow += delta
    else day.outflow += -delta
  }
  return { added, sold, fees, net: added + fees - sold, days }
}
