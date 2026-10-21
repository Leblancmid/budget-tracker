import { Amt } from '@/components/ui/Amt'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatCurrency } from '@/utils/format'
import type { BusinessTransaction } from '@/types'
import { txProfitPhp } from './salesUtils'

/** Totals across all pending gold trades, with received / paid progress. */
export function PendingGoldTotals({ trades }: { trades: BusinessTransaction[] }) {
  const sum = (pick: (tx: BusinessTransaction) => string | null | undefined) =>
    trades.reduce((s, tx) => s + Number(pick(tx) ?? 0), 0)
  const price    = sum((tx) => tx.price_gold)
  const received = sum((tx) => tx.price_gold_received)
  const cost     = sum((tx) => tx.cost_gold)
  const paid     = sum((tx) => tx.cost_gold_paid)
  const profit   = trades.reduce((s, tx) => s + (txProfitPhp(tx) ?? 0), 0)
  const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-gray-100 dark:bg-gray-700/40 border-b border-gray-100 dark:border-gray-700/60">
      {[
        { label: 'Total Price',    value: `${price.toLocaleString()} G`,    cls: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Total Received', value: `${received.toLocaleString()} G`, cls: 'text-emerald-600 dark:text-emerald-400', progress: pct(received, price), left: price - received, leftLabel: 'to receive' },
        { label: 'Total Cost',     value: `${cost.toLocaleString()} G`,     cls: 'text-red-500 dark:text-red-400' },
        { label: 'Total Paid',     value: `${paid.toLocaleString()} G`,     cls: 'text-red-500 dark:text-red-400', progress: pct(paid, cost), left: cost - paid, leftLabel: 'to pay' },
        { label: 'Total Profit (₱)', value: <Amt value={formatCurrency(profit)} />, cls: profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400' },
      ].map(({ label, value, cls, progress, left, leftLabel }) => (
        <div key={label} className={['flex flex-col gap-1 bg-white dark:bg-gray-900 px-5 py-3', label.startsWith('Total Profit') ? 'col-span-2 lg:col-span-1' : ''].join(' ')}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</span>
          <span className={['text-sm font-bold', cls].join(' ')}>{value}</span>
          {progress != null && (
            <div className="flex items-center gap-2">
              <ProgressBar percent={progress} color="bg-amber-500" className="flex-1" />
              <span className={['text-[10px] font-semibold', progress >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'].join(' ')}>
                {Math.round(progress)}%
              </span>
            </div>
          )}
          {left != null && left > 0 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{left.toLocaleString()} G {leftLabel}</span>
          )}
        </div>
      ))}
    </div>
  )
}
