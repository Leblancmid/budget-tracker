import type { BusinessTransaction } from '@/types'
import { goldTopUp } from '@/utils/goldTrade'
import { formatCurrency } from '@/utils/format'
import { Amt } from '@/context/AmountVisibilityContext'

export type GoldTradeSide = 'price' | 'cost'

export interface GoldTradeTargetValue {
  tradeId: number | null
  side: GoldTradeSide
}

interface GoldTradeTargetProps {
  /** Pending gold trades to choose from */
  trades: BusinessTransaction[]
  value: GoldTradeTargetValue
  onChange: (value: GoldTradeTargetValue) => void
  /** Gold amount being entered, for the before → after preview */
  amount: number
}

/** "Apply to gold trade" picker: sends the entered gold onto a trade's Price or Cost (G). */
export function GoldTradeTarget({ trades, value, onChange, amount }: GoldTradeTargetProps) {
  const trade   = trades.find((t) => t.id === value.tradeId) ?? null
  const preview = trade && amount > 0
    ? goldTopUp(trade, value.side === 'price' ? amount : 0, value.side === 'cost' ? amount : 0)
    : null
  const current = trade ? Number((value.side === 'price' ? trade.price_gold : trade.cost_gold) ?? 0) : 0
  const next    = preview ? (value.side === 'price' ? preview.newPrice : preview.newCost) : current

  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-2.5">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Apply to gold trade <span className="normal-case font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        </p>
        <select
          value={value.tradeId ?? ''}
          onChange={(e) => onChange({ ...value, tradeId: e.target.value ? Number(e.target.value) : null })}
          className="block w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-colors"
        >
          <option value="">None — inventory only</option>
          {trades.map((t) => (
            <option key={t.id} value={t.id}>
              {t.description || 'Gold Trade'} · Price {Number(t.price_gold ?? 0).toLocaleString()} G · Cost {Number(t.cost_gold ?? 0).toLocaleString()} G
            </option>
          ))}
        </select>
      </div>

      {trade && (
        <>
          <div className="flex gap-2">
            {(['price', 'cost'] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => onChange({ ...value, side })}
                className={[
                  'flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors',
                  value.side === side
                    ? side === 'price'
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'border-red-300 bg-red-50 text-red-600 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400'
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                ].join(' ')}
              >
                Add to {side === 'price' ? 'Price' : 'Cost'} (G)
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {value.side === 'price' ? 'Price' : 'Cost'} (G): {current.toLocaleString()} G
            {preview && (
              <> → <span className={['font-semibold', value.side === 'price' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>{next.toLocaleString()} G</span></>
            )}
            {preview?.profitPhp != null && (
              <> · profit <Amt value={formatCurrency(preview.profitPhp)} /></>
            )}
          </p>
        </>
      )}
    </div>
  )
}
