import { Coins, TrendingDown, TrendingUp } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import { formatCurrency } from '@/utils/format'
import type { BusinessTransaction } from '@/types'
import { txProfitPhp } from './salesUtils'

/** ₱ profit of an account's pricing, or an "Awaiting pricing" prompt. */
export function ProfitPhpBar({ tx, dimmed = false, onSetPricing }: { tx: BusinessTransaction | null | undefined; dimmed?: boolean; onSetPricing?: () => void }) {
  const profit = txProfitPhp(tx)

  if (profit == null) {
    return (
      <button
        type="button"
        onClick={onSetPricing}
        disabled={!onSetPricing}
        className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 px-3 py-2 text-left enabled:hover:bg-amber-50 dark:enabled:hover:bg-amber-900/20 transition-colors"
      >
        <Coins size={12} className="text-amber-500 dark:text-amber-400 shrink-0" />
        <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Awaiting pricing</span>
        {onSetPricing && <span className="ml-auto text-[11px] font-semibold text-amber-600 dark:text-amber-400">Set rates →</span>}
      </button>
    )
  }

  const positive = profit >= 0
  return (
    <div className={[
      'flex items-center gap-1.5 rounded-lg px-3 py-2',
      dimmed ? 'bg-gray-100 dark:bg-gray-700/30' : positive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20',
    ].join(' ')}>
      {positive
        ? <TrendingUp size={12} className={dimmed ? 'text-gray-400' : 'text-emerald-600 dark:text-emerald-400 shrink-0'} />
        : <TrendingDown size={12} className={dimmed ? 'text-gray-400' : 'text-red-500 dark:text-red-400 shrink-0'} />
      }
      <span className="text-xs text-gray-500 dark:text-gray-400">Profit (₱)</span>
      <span className={['text-sm font-bold ml-auto', dimmed ? 'text-gray-500 dark:text-gray-400' : positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
        <Amt value={formatCurrency(profit)} />
      </span>
    </div>
  )
}
