import { BadgeCheck, Minus, Plus, ScanSearch } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import { formatDate, todayManila } from '@/utils/format'
import { colorOf, dailyInterest, fmtIn, fmtPhp, iconOf } from '@/utils/balanceAccounts'
import type { BalanceAccountConfig, BalanceEntryType } from '@/types'
import { formatShare, type AccountStats } from './balanceStats'

/** Days since the last bank check, or null if never checked. */
function daysSinceCheck(checkedAt: string | null | undefined): number | null {
  if (!checkedAt) return null
  const ms = Date.parse(todayManila() + 'T00:00:00Z') - Date.parse(checkedAt + 'T00:00:00Z')
  return Math.max(0, Math.round(ms / 86_400_000))
}

/** One account card: balance, share of net worth, and quick Add / Sell. Click to filter the history. */
export function AccountTile({ account: a, stats: s, share, phpRate, active, onToggleFilter, onAdd, onCheck }: {
  account: BalanceAccountConfig
  stats: AccountStats | undefined
  /** Share of the positive-balance total, 0–1 */
  share: number
  phpRate: number
  /** The history is filtered to this account */
  active: boolean
  onToggleFilter: () => void
  onAdd: (type: BalanceEntryType) => void
  /** Bank check: match the balance to what the bank shows */
  onCheck: () => void
}) {
  const checkedDays = daysSinceCheck(a.checked_at)
  const checkDue    = checkedDays == null || checkedDays >= 7
  const c    = colorOf(a.color)
  const Icon = iconOf(a.icon)
  const bal  = s?.balance ?? 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggleFilter}
      onKeyDown={(e) => { if (e.key === 'Enter') onToggleFilter() }}
      title={active ? 'Showing only this account below — click to show all' : 'Show only this account in the history'}
      className={[
        'group relative flex flex-col overflow-hidden rounded-xl border bg-white dark:bg-gray-900 cursor-pointer transition-all',
        active ? ['border-transparent ring-2', c.ring].join(' ') : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm',
        a.hidden_at ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div className={['h-1 w-full', c.swatch].join(' ')} />

      <div className={['flex items-center gap-3 px-4 py-3', c.soft].join(' ')}>
        <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', c.iconTile].join(' ')}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {a.name}
            {a.hidden_at && <span className="ml-1.5 text-[10px] font-semibold uppercase text-gray-400">Hidden</span>}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{a.currency} account</p>
        </div>
        {share > 0 && (
          <span className="rounded-full bg-white/70 dark:bg-gray-800/70 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
            {formatShare(share)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
        <div>
          <p className={['text-2xl font-bold', bal < 0 ? 'text-red-600 dark:text-red-400' : c.text].join(' ')}>
            <Amt value={fmtIn(a, bal)} />
          </p>
          {a.currency === 'USD' && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">≈ <Amt value={fmtPhp(bal * phpRate)} /></p>
          )}
          {!!a.interest_rate && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              title={`${a.interest_rate}% a year, credited daily after ${a.interest_tax ?? 20}% tax`}>
              {a.interest_rate}% a year · +<Amt value={fmtIn(a, dailyInterest(bal, a.interest_rate, a.interest_tax ?? 20))} />/day
            </p>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onCheck() }}
            title="Compare with what the bank shows and fix any difference"
            className={[
              'mt-1.5 flex items-center gap-1 text-[11px] font-semibold transition-colors',
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
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div className={['h-full rounded-full', c.swatch].join(' ')} style={{ width: `${share * 100}%` }} />
        </div>

        <div className="mt-auto flex items-center gap-2">
          <p className="flex-1 min-w-0 truncate text-[11px] text-gray-400 dark:text-gray-500">
            {s ? <>Last {formatDate(s.last!)} · {s.count} entr{s.count === 1 ? 'y' : 'ies'}</> : 'No entries yet'}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd('add') }}
            className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <Plus size={11} /> Add
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd('sell') }}
            className="flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <Minus size={11} /> Sell
          </button>
        </div>
      </div>
    </div>
  )
}
