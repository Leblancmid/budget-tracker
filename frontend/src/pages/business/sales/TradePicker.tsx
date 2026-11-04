import { Coins } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import type { BusinessTransaction } from '@/types'
import { tradeShareCostPhp } from '@/utils/accountCost'
import { costPaidInPhp, usableGold } from '@/utils/goldTrade'

const php = (n: number) => `₱${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Why a trade can't pay right now, or null when it can. */
function blockedReason(t: BusinessTransaction): string | null {
  if (usableGold(t) <= 0) return 'Not received yet'
  if (t.cost_php == null) return 'Add cost rates in Edit Gold first'
  return null
}

/**
 * Pick the gold trade an account was paid with: one card per trade with the gold in hand and
 * what 1M of it cost. Gold a buyer still owes you (not received yet) can't be used.
 */
export function TradePicker({ trades, value, onChange, error }: {
  trades: BusinessTransaction[]
  value: number | null
  onChange: (id: number) => void
  error?: string
}) {
  // Usable trades first, the rest greyed out below with the reason
  const sorted = [...trades].sort((a, b) => Number(!!blockedReason(a)) - Number(!!blockedReason(b)))

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Gold trade</p>
      <div className="flex max-h-[26rem] flex-col gap-1.5 overflow-y-auto scrollbar-thin pr-1" role="radiogroup" aria-label="Gold trade">
        {sorted.map((t) => {
          const blocked  = blockedReason(t)
          const selected = value === t.id
          const usable   = usableGold(t)
          const price    = Number(t.price_gold ?? 0)
          const perM     = tradeShareCostPhp({ price_gold: price, cost_gold: Number(t.cost_gold ?? 0), cost_php: t.cost_php != null ? Number(t.cost_php) : null }, 1_000_000)
          const rates    = costPaidInPhp(t.cost_gold, t.cost_php)
            ? 'Paid in ₱'
            : t.cost_rate ? `${Number(t.cost_rate)} × ${Number(t.cost_php_rate ?? t.php_rate)}` : null
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!!blocked}
              title={blocked ?? undefined}
              onClick={() => onChange(t.id)}
              className={[
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed',
                selected
                  ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-400 dark:border-amber-500/70 dark:bg-amber-900/20 dark:ring-amber-500/50'
                  : blocked
                  ? 'border-dashed border-gray-200 opacity-60 dark:border-gray-700'
                  : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/40 dark:border-gray-700 dark:hover:border-amber-600/60 dark:hover:bg-amber-900/10',
              ].join(' ')}
            >
              <span className={['flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', selected ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'].join(' ')}>
                <Coins size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{t.description || 'Gold trade'}</span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                  {perM != null ? <><Amt value={php(perM)} /> per 1M</> : 'No cost yet'}
                  {rates && <> · {rates}</>}
                </span>
              </span>
              <span className="shrink-0 text-right">
                {blocked ? (
                  <span className="block text-xs font-semibold text-amber-600 dark:text-amber-400">{blocked}</span>
                ) : (
                  <span className="block text-sm font-bold text-gray-800 dark:text-gray-100">{usable.toLocaleString()} G</span>
                )}
                <span className="block text-[11px] text-gray-400 dark:text-gray-500">
                  {usable < price ? `${usable.toLocaleString()} of ${price.toLocaleString()} received` : 'available'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
