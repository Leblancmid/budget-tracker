import { Calendar, CalendarClock, Coins, HandCoins, Pencil, RotateCcw, Trash2, User } from 'lucide-react'
import { formatDate } from '@/utils/format'
import type { BusinessTransaction, RucoyAccount } from '@/types'
import { ProfitPhpBar } from './ProfitPhpBar'
import { fmtGold, PAYMENT_STATUS_STYLES } from './salesUtils'

export function AccountCard({ a, tx, onEdit, onArchive, onDelete, onConvertToGold, archived = false, onUnarchive }: {
  a: RucoyAccount
  tx?: BusinessTransaction | null
  onEdit?: () => void
  onArchive?: () => void
  onDelete?: () => void
  onConvertToGold?: () => void
  archived?: boolean
  onUnarchive?: () => void
}) {
  const profitPositive = (a.profit ?? 0) >= 0

  return (
    <div className={[
      'group relative flex flex-col rounded-xl border bg-white dark:bg-gray-900 transition-all duration-200',
      archived
        ? 'border-gray-100 dark:border-gray-800 opacity-75'
        : 'border-gray-100 dark:border-gray-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm',
    ].join(' ')}>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 p-4 pb-3">
        {a.avatar ? (
          <img
            src={a.avatar}
            alt={a.email}
            className="h-11 w-11 shrink-0 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
          />
        ) : (
          <div className={[
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2',
            archived
              ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'
              : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800',
          ].join(' ')}>
            <User className={['h-5 w-5', archived ? 'text-gray-400' : 'text-slate-500 dark:text-slate-400'].join(' ')} />
          </div>
        )}

        <div className="flex-1 basis-32 min-w-0">
          {a.description && (
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 leading-snug">
              {a.description}
            </p>
          )}
          <p className={['text-xs truncate mt-0.5', a.description ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300 font-medium'].join(' ')}>
            {a.email}
          </p>
        </div>

        {/* Actions */}
        <div className={['ml-auto flex items-center gap-1 shrink-0', archived ? '' : 'md:opacity-0 md:group-hover:opacity-100 transition-opacity'].join(' ')}>
          {archived ? (
            <button
              onClick={onUnarchive}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              title="Restore"
            >
              <RotateCcw size={13} />
            </button>
          ) : (
            <>
              <button
                onClick={onArchive}
                title="Mark as sold"
                className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              >
                <HandCoins size={12} />
                Sell
              </button>
              <button
                onClick={onConvertToGold}
                title="Convert to gold trade"
                className="mr-1 flex items-center gap-1 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                <Coins size={12} />
                To Gold
              </button>
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                title="Edit"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats row (gold) */}
      {(a.price != null || a.cost != null || a.profit != null) && (
        <div className="mx-4 mb-2 grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 overflow-hidden">
          {[
            { label: 'Price',  value: a.price,  color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Cost',   value: a.cost,   color: 'text-gray-600 dark:text-gray-400' },
            { label: 'Profit', value: a.profit, color: profitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center py-2.5 px-1">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</span>
              <span className={['text-xs font-bold mt-0.5', value != null ? color : 'text-gray-300 dark:text-gray-600'].join(' ')}>
                {value != null ? fmtGold(value) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Profit row (PHP, from the linked business transaction) */}
      <div className="mx-4 mb-3">
        <ProfitPhpBar tx={tx} dimmed={archived} onSetPricing={archived ? undefined : onEdit} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <span className={['inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', PAYMENT_STATUS_STYLES[a.payment_status].className].join(' ')}>
          {PAYMENT_STATUS_STYLES[a.payment_status].label}
        </span>
        {tx?.date && (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            <Calendar size={11} />
            {formatDate(tx.date)}
          </span>
        )}
        {!archived && a.payment_date && <PaymentDue date={a.payment_date} />}
      </div>
    </div>
  )
}

/** "3d left" / "Due today" / "2d overdue", coloured by urgency. */
function PaymentDue({ date }: { date: string }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due   = new Date(date + 'T00:00:00')
  const diff  = Math.round((due.getTime() - today.getTime()) / 86400000)
  const isPast  = diff < 0
  const isToday = diff === 0
  const isClose = diff > 0 && diff <= 7
  const color = isPast
    ? 'text-red-600 dark:text-red-400'
    : isToday
    ? 'text-orange-500 dark:text-orange-400'
    : isClose
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-emerald-600 dark:text-emerald-400'
  const label = isPast
    ? `${Math.abs(diff)}d overdue`
    : isToday ? 'Due today'
    : `${diff}d left`
  return (
    <span className={['ml-auto inline-flex items-center gap-1 text-[11px] font-semibold', color].join(' ')}>
      <CalendarClock size={11} />
      {label}
    </span>
  )
}
