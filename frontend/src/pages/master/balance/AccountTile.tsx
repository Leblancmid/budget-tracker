import { BadgeCheck, CreditCard, Minus, Plus, ScanSearch, ShoppingBag, Wifi } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import { formatDate, todayManila } from '@/utils/format'
import { cardGradientOf, colorOf, creditUsed, dailyInterest, fmtIn, fmtPhp, iconOf, isCredit, owedOn, spendable } from '@/utils/balanceAccounts'
import type { BalanceAccountConfig, BalanceEntryType } from '@/types'
import { formatShare, type AccountStats } from './balanceStats'

/** Days since the last bank check, or null if never checked. */
function daysSinceCheck(checkedAt: string | null | undefined): number | null {
  if (!checkedAt) return null
  const ms = Date.parse(todayManila() + 'T00:00:00Z') - Date.parse(checkedAt + 'T00:00:00Z')
  return Math.max(0, Math.round(ms / 86_400_000))
}

/**
 * One account, drawn as a bank card: name and logo, a chip, and the balance (or, for a credit card,
 * what's owed and how much of the limit is left). Below it: the bank check and quick actions.
 * Click the card to filter the history to it.
 */
export function AccountTile({ account: a, stats: s, share, phpRate, active, onToggleFilter, onAdd, onPay, onCheck, className = '' }: {
  account: BalanceAccountConfig
  stats: AccountStats | undefined
  /** Share of the positive-balance total, 0–1 */
  share: number
  phpRate: number
  /** The history is filtered to this account */
  active: boolean
  onToggleFilter: () => void
  onAdd: (type: BalanceEntryType) => void
  /** Credit cards: pay the bill from another account */
  onPay: () => void
  /** Bank check: match the balance to what the bank shows */
  onCheck: () => void
  /** Sizing from the page (e.g. a swipe row on phones) */
  className?: string
}) {
  const checkedDays = daysSinceCheck(a.checked_at)
  const checkDue    = checkedDays == null || checkedDays >= 7
  const c       = colorOf(a.color)
  const Icon    = iconOf(a.icon)
  const bal     = s?.balance ?? 0
  const credit  = isCredit(a)
  const owed    = owedOn(bal)
  const used    = creditUsed(a, bal)
  const left    = spendable(a, bal)

  return (
    <div className={['flex flex-col gap-2.5', a.hidden_at ? 'opacity-60' : '', className].join(' ')}>
      {/* ── The card ─────────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-pressed={active}
        onClick={onToggleFilter}
        onKeyDown={(e) => { if (e.key === 'Enter') onToggleFilter() }}
        title={active ? 'Showing only this account below — click to show all' : 'Show only this account in the history'}
        className={[
          'group relative flex aspect-[1.586/1] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-lg shadow-gray-900/15 transition-all sm:p-5 dark:shadow-black/40',
          'hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40',
          cardGradientOf(a.color),
          active ? ['ring-2 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-950', c.ring].join(' ') : '',
        ].join(' ')}
      >
        {/* Decorations: soft circles and a swoosh, like a printed card */}
        <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-black/10" />
        <svg aria-hidden="true" viewBox="0 0 300 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-[30%] h-10 w-full text-white/15">
          <path d="M0 40 C 60 10, 120 55, 180 30 S 270 10, 300 25" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>

        {/* Top: logo, name, and the share or card type */}
        <div className="relative flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
            <Icon size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold leading-tight tracking-tight">{a.name}</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">
              {credit ? 'Credit card' : `${a.currency} account`}
              {a.hidden_at && ' · hidden'}
            </p>
          </div>
          {!credit && share > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm" title="Share of your money">
              {formatShare(share)}
            </span>
          )}
        </div>

        {/* Middle: chip and contactless mark */}
        <div className="relative flex items-center gap-2">
          <span aria-hidden="true" className="relative h-7 w-10 overflow-hidden rounded-md bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-500 shadow-inner">
            <span className="absolute inset-x-0 top-1/2 h-px bg-amber-700/40" />
            <span className="absolute inset-y-0 left-1/3 w-px bg-amber-700/40" />
            <span className="absolute inset-y-0 left-2/3 w-px bg-amber-700/40" />
          </span>
          <Wifi aria-hidden="true" size={18} className="rotate-90 text-white/70" />
        </div>

        {/* Bottom: the balance (or what's owed) and the card mark */}
        <div className="relative flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">{credit ? 'Owed' : 'Balance'}</p>
            <p className="truncate text-2xl font-bold tabular-nums tracking-tight">
              <Amt value={fmtIn(a, credit ? owed : bal)} />
            </p>
            {credit ? (
              a.credit_limit ? (
                <div className="mt-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                    <div className={['h-full rounded-full', used >= 0.9 ? 'bg-red-300' : used >= 0.7 ? 'bg-amber-200' : 'bg-white'].join(' ')} style={{ width: `${used * 100}%` }} />
                  </div>
                  <p className="mt-1 truncate text-[11px] text-white/80">
                    <Amt value={fmtIn(a, Math.max(0, left))} /> left of <Amt value={fmtIn(a, a.credit_limit)} />
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-white/80">No limit set</p>
              )
            ) : a.currency === 'USD' ? (
              <p className="truncate text-[11px] text-white/80">≈ <Amt value={fmtPhp(bal * phpRate)} /></p>
            ) : null}
          </div>
          {/* A generic card-network mark (two overlapping circles) */}
          <span aria-hidden="true" className="flex shrink-0 items-center">
            <span className="h-7 w-7 rounded-full bg-white/45" />
            <span className="-ml-3 h-7 w-7 rounded-full bg-white/25" />
          </span>
        </div>
      </div>

      {/* ── Under the card: checks and actions ────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
        <button
          onClick={onCheck}
          title="Compare with what the bank shows and fix any difference"
          className={[
            '-mx-1 flex items-center gap-1 rounded px-1 py-1.5 text-[11px] font-semibold transition-colors sm:py-0.5',
            checkDue
              ? 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
          ].join(' ')}
        >
          {checkDue ? <ScanSearch size={12} /> : <BadgeCheck size={12} className="text-emerald-500" />}
          {checkedDays == null
            ? 'Check against bank'
            : checkedDays === 0
            ? 'Checked today'
            : `Checked ${checkedDays} day${checkedDays === 1 ? '' : 's'} ago${checkDue ? ' · check again' : ''}`}
        </button>
        {!credit && !!a.interest_rate && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            title={`${a.interest_rate}% a year, credited daily after ${a.interest_tax ?? 20}% tax`}>
            {a.interest_rate}% a year · +<Amt value={fmtIn(a, dailyInterest(bal, a.interest_rate, a.interest_tax ?? 20))} />/day
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 px-1">
        <p className="min-w-0 flex-1 truncate text-[11px] text-gray-400 dark:text-gray-500">
          {s ? <>Last {formatDate(s.last!)} · {s.count} entr{s.count === 1 ? 'y' : 'ies'}</> : 'No entries yet'}
        </p>
        {credit ? (
          <>
            <button
              onClick={() => onAdd('sell')}
              title="Record something bought with this card"
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:py-1 sm:text-[11px] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <ShoppingBag size={12} /> Spend
            </button>
            <button
              onClick={onPay}
              title="Pay the card from one of your accounts"
              className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 sm:py-1 sm:text-[11px] dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
            >
              <CreditCard size={12} /> Pay bill
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onAdd('add')}
              className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 sm:py-1 sm:text-[11px] dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
            >
              <Plus size={12} /> Add
            </button>
            <button
              onClick={() => onAdd('sell')}
              className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 sm:py-1 sm:text-[11px] dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              <Minus size={12} /> Sell
            </button>
          </>
        )}
      </div>
    </div>
  )
}
