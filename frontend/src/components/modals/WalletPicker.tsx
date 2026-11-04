import { Ban } from 'lucide-react'
import type { BalanceAccountConfig } from '@/types'
import { colorOf, fmtIn, iconOf } from '@/utils/balanceAccounts'
import { Amt } from '@/components/ui/Amt'

/**
 * Pick the Balance wallet money comes out of (or goes into), with each wallet's balance,
 * and the chosen one's balance before → after. Used by expenses/income and bought gold.
 */
export function WalletPicker({ label, accounts, value, onChange, balanceOf = (a) => a.balance ?? 0, changeFor, error, noneLabel = 'None', allowNone = true }: {
  label: string
  accounts: BalanceAccountConfig[]
  /** Selected wallet code; null = none; undefined = nothing picked yet */
  value: string | null | undefined
  onChange: (code: string | null) => void
  /** A wallet's balance before this change (e.g. without the record being edited) */
  balanceOf?: (a: BalanceAccountConfig) => number
  /** Signed change to a wallet in its own currency (− = paid out); null = not known yet */
  changeFor: (a: BalanceAccountConfig) => number | null
  error?: string
  /** Label of the "no wallet" choice */
  noneLabel?: string
  /** Offer the "no wallet" choice (off for transfers, which always need both sides) */
  allowNone?: boolean
}) {
  const linked = accounts.find((a) => a.code === value)
  const chip = 'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors'
  const idle = 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">Updates your Balance</span>
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {allowNone && (
          <button
            type="button"
            role="radio"
            aria-checked={value === null}
            onClick={() => onChange(null)}
            className={[chip, value === null ? 'border-gray-400 bg-gray-100 text-gray-700 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-200' : idle].join(' ')}
          >
            <Ban size={12} /> {noneLabel}
          </button>
        )}
        {accounts.map((a) => {
          const c = colorOf(a.color)
          const Icon = iconOf(a.icon)
          const selected = value === a.code
          const balance = balanceOf(a)
          return (
            <button
              key={a.code}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(a.code)}
              className={[chip, selected ? ['border-transparent ring-2', c.ring, c.soft, c.text].join(' ') : idle].join(' ')}
            >
              <span className={['flex h-5 w-5 items-center justify-center rounded-md', c.iconTile].join(' ')}><Icon size={11} /></span>
              <span className="flex flex-col items-start leading-tight">
                <span>{a.name}</span>
                <span className={['text-[10px] font-medium', balance < 0 ? 'text-red-500' : 'opacity-70'].join(' ')}>
                  <Amt value={fmtIn(a, balance)} />
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected wallet: balance before → after */}
      {linked && (() => {
        const c      = colorOf(linked.color)
        const before = balanceOf(linked)
        const change = changeFor(linked)
        const after  = change != null ? before + change : null
        const short  = change != null && change < 0 && after! < 0
        return (
          <div className={['mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-xs', c.soft].join(' ')}>
            <span className="font-semibold text-gray-700 dark:text-gray-200">{linked.name}</span>
            <span className="text-gray-500 dark:text-gray-400">
              <Amt value={fmtIn(linked, before)} />
              {change != null && change !== 0 && (
                <>
                  {' → '}
                  <b className={short ? 'text-red-600 dark:text-red-400' : change > 0 ? 'text-emerald-600 dark:text-emerald-400' : c.text}>
                    <Amt value={fmtIn(linked, after!)} />
                  </b>
                </>
              )}
            </span>
            {short && (
              <span className="ml-auto font-semibold text-red-600 dark:text-red-400">
                Not enough — short by <Amt value={fmtIn(linked, -after!)} />
              </span>
            )}
          </div>
        )
      })()}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
