import { formatWithCommas, handleAmountInput } from '@/utils/format'
import { cashToPhp, type CashCurrency } from '@/utils/cash'

const inputCls = 'block w-full rounded-lg border border-gray-300 hover:border-gray-400 bg-white px-2.5 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-600 dark:hover:border-gray-500 transition-colors'
const readonlyCls = 'rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs sm:text-sm font-semibold dark:border-gray-700 dark:bg-gray-800/60 truncate'
const fmtPHP = (v: number | null) =>
  v != null ? `₱${v.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'

interface Row {
  key: 'price' | 'cost'
  label: string
  hint: string
  amount: string
  onAmount: (v: string) => void
  phpRate: string
  onPhpRate: (v: string) => void
  color: string
}

/**
 * Price and cost of an account bought / sold for cash. Pesos need just the amount;
 * dollars follow the same "amount × PHP rate = ₱" pattern as the gold rows.
 */
export function CashPricing({ currency, onCurrency, rows }: {
  currency: CashCurrency
  onCurrency: (c: CashCurrency) => void
  rows: Row[]
}) {
  const symbol = currency === 'PHP' ? '₱' : '$'
  const chip = (c: CashCurrency, label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={currency === c}
      onClick={() => onCurrency(c)}
      className={[
        'rounded-full border px-3 py-2 sm:py-1 text-xs font-semibold transition-colors',
        currency === c
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800',
      ].join(' ')}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Currency">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Paid in</span>
        {chip('PHP', '₱ Peso')}
        {chip('USD', '$ Dollar')}
      </div>

      {rows.map((row) => {
        const php = cashToPhp(row.amount, currency, row.phpRate)
        return (
          <div key={row.key}>
            <div className="flex items-end gap-1.5 sm:gap-2">
              <div className="flex-[1.4] min-w-0">
                <label htmlFor={`cash-${row.key}`} className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{row.label}</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-sm font-semibold text-gray-400">{symbol}</span>
                  <input
                    id={`cash-${row.key}`}
                    type="text"
                    inputMode="decimal"
                    value={formatWithCommas(row.amount)}
                    onChange={(e) => handleAmountInput(e.target.value, row.onAmount)}
                    placeholder="0.00"
                    className={[inputCls, 'pl-7'].join(' ')}
                  />
                </div>
              </div>
              {currency === 'USD' && (
                <>
                  <span className="pb-2 text-gray-400 dark:text-gray-500 text-xs sm:text-sm font-medium shrink-0">×</span>
                  <div className="flex-1 min-w-0">
                    <label htmlFor={`cash-${row.key}-rate`} className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400 truncate">PHP Rate</label>
                    <input id={`cash-${row.key}-rate`} type="text" inputMode="decimal" value={row.phpRate} onChange={(e) => handleAmountInput(e.target.value, row.onPhpRate)} placeholder="58.5" className={inputCls} />
                  </div>
                  <span className="pb-2 text-gray-400 dark:text-gray-500 text-xs sm:text-sm font-medium shrink-0">=</span>
                  <div className="flex-[1.2] min-w-0">
                    <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{row.key === 'price' ? 'Price (₱)' : 'Cost (₱)'}</p>
                    <div className={[readonlyCls, row.color].join(' ')}>{fmtPHP(php)}</div>
                  </div>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{row.hint}</p>
          </div>
        )
      })}
    </div>
  )
}
