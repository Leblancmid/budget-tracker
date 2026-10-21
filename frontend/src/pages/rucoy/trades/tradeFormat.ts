import { formatCurrency } from '@/utils/format'
import { CURRENCY_SYMBOLS } from '@/utils/rucoy'
import type { Trade } from '@/types'

export const PER_PAGE = 10

/** KKS trades in G; cash trades in their currency. */
export function formatAmount(t: Trade): string {
  if (t.status === 'kks') return `${Number(t.amount).toLocaleString()} G`
  const symbol = t.currency ? CURRENCY_SYMBOLS[t.currency] : '₱'
  if (symbol === '₱') return formatCurrency(parseFloat(t.amount))
  return `${symbol}${Number(t.amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Countdown pill for a trade's completion date. */
export function dueLabel(date: string | null, today = new Date()): { text: string; cls: string } {
  if (!date) return { text: 'No date', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' }
  const start = new Date(today); start.setHours(0, 0, 0, 0)
  const diff = Math.round((new Date(date.slice(0, 10) + 'T00:00:00').getTime() - start.getTime()) / 86400000)
  if (diff < 0)   return { text: `${-diff}d overdue`, cls: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' }
  if (diff === 0) return { text: 'Due today', cls: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' }
  if (diff <= 7)  return { text: `in ${diff}d`, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
  return { text: `in ${diff}d`, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
}

/** Trades with a completion date first (soonest or latest), those without last. */
export function sortByCompletion(trades: Trade[], dir: 'asc' | 'desc'): Trade[] {
  return [...trades].sort((a, b) => {
    const da = a.completion_date ?? '', db = b.completion_date ?? ''
    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1
    return dir === 'asc' ? da.localeCompare(db) : db.localeCompare(da)
  })
}
