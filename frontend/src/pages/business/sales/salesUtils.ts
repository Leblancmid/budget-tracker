import type { AccountPaymentStatus, BusinessTransaction, RucoyAccount } from '@/types'
import { MONTHS } from '@/utils/format'

export const fmtGold = (n: number) => `${n.toLocaleString()} G`

export const BIZ_TYPE_LABELS: Record<string, string> = { account: 'Account', gold: 'Gold', expense: 'Item' }
export const BIZ_TYPE_COLORS: Record<string, string> = { account: '#6366f1', gold: '#f59e0b', expense: '#ef4444' }

export const PAYMENT_STATUS_STYLES: Record<AccountPaymentStatus, { label: string; className: string }> = {
  not_paid:       { label: 'Not Paid',       className: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  partially_paid: { label: 'Partially Paid', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  fully_paid:     { label: 'Fully Paid',     className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

export type StatusFilter = 'all' | AccountPaymentStatus | 'overdue' | 'due' | 'pricing'

export const STATUS_FILTERS: [StatusFilter, string][] = [
  ['all', 'All'], ['not_paid', 'Not paid'], ['partially_paid', 'Partially paid'], ['fully_paid', 'Fully paid'],
  ['overdue', 'Overdue'], ['due', 'Due soon'], ['pricing', 'Awaiting pricing'],
]

const now = new Date()
export const CUR_M     = now.getMonth()
export const CUR_Y     = now.getFullYear()
export const CUR_LABEL = `${MONTHS[CUR_M]} ${CUR_Y}`

/** Whole days until the payment date (negative = overdue), or null without one. */
export function daysUntilPayment(a: RucoyAccount): number | null {
  if (!a.payment_date) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((new Date(a.payment_date + 'T00:00:00').getTime() - today.getTime()) / 86400000)
}

export const isOverdue = (a: RucoyAccount) => a.payment_status !== 'fully_paid' && (daysUntilPayment(a) ?? 0) < 0

export const isDueSoon = (a: RucoyAccount) => {
  const d = daysUntilPayment(a)
  return a.payment_status !== 'fully_paid' && d != null && d >= 0 && d <= 7
}

/** PHP profit of a priced business transaction, or null while awaiting pricing. */
export function txProfitPhp(tx: BusinessTransaction | null | undefined): number | null {
  if (!tx || tx.price_php == null || tx.cost_php == null) return null
  return tx.profit_php != null ? parseFloat(tx.profit_php) : parseFloat(tx.price_php) - parseFloat(tx.cost_php)
}

/** Next sort state when a sort button is clicked: off → high-to-low → low-to-high → off. */
export const nextSort = (s: 'asc' | 'desc' | null) => (s === null ? 'desc' : s === 'desc' ? 'asc' : null)

/**
 * What a sale of `sellNum` G out of the trade's price leaves behind. Cost comes off by the same
 * gold as the price (capped at the cost there is), e.g. 1,200 / 700 selling 200 → 1,000 / 500.
 * Matches the API's partial-sale rule.
 */
export function sellPreview(target: BusinessTransaction, sellNum: number) {
  const sellTotal = target.price_gold != null ? Number(target.price_gold) : 0
  const fraction  = sellTotal > 0 ? Math.min(sellNum / sellTotal, 1) : 0
  const costTotal = Number(target.cost_gold ?? 0)
  const costGold  = fraction >= 1 ? costTotal : Math.min(sellNum, costTotal)
  const costShare = costTotal > 0 ? costGold / costTotal : 0
  return {
    sellTotal,
    fraction,
    pricePhp:      Number(target.price_php ?? 0) * fraction,
    costPhp:       Number(target.cost_php ?? 0) * costShare,
    costGold,
    remaining:     Math.max(sellTotal - sellNum, 0),
    remainingCost: Math.max(costTotal - costGold, 0),
  }
}
