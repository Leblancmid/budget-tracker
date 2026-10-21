import { Banknote, CalendarClock, Check, Coins, HandCoins, Pencil, Trash2 } from 'lucide-react'
import { formatDateLong, formatTime } from '@/utils/format'
import type { Trade } from '@/types'
import { StatusPill } from './StatusPill'
import { dueLabel, formatAmount } from './tradeFormat'

/** An active trade: amount, payment method, middleman fee and completion countdown. */
export function TradeCard({ trade: t, archiving, onDone, onEdit, onDelete }: {
  trade: Trade
  /** An archive is in progress (disables Done) */
  archiving: boolean
  onDone: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const isKks = t.status === 'kks'
  const due   = dueLabel(t.completion_date)

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all">
      <div className={['h-1 w-full', isKks ? 'bg-amber-400' : 'bg-emerald-500'].join(' ')} />
      <div className="flex items-start gap-3 px-4 pt-3.5">
        <span className={['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', isKks ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'].join(' ')}>
          {isKks ? <Coins size={18} /> : <Banknote size={18} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{t.description || (isKks ? 'KKS trade' : 'Cash trade')}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Added {formatDateLong(t.created_at)} · {formatTime(t.created_at)}</p>
        </div>
        <StatusPill status={t.status} />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
        <p className={['text-2xl font-bold', isKks ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'].join(' ')}>
          {formatAmount(t)}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {t.payment_method && (
            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-semibold capitalize text-gray-600 dark:text-gray-300">{t.payment_method}</span>
          )}
          {isKks && t.middleman_fee != null && Number(t.middleman_fee) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
              <HandCoins size={10} /> MM fee {Number(t.middleman_fee).toLocaleString()} G
            </span>
          )}
          <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', due.cls].join(' ')}>
            <CalendarClock size={10} /> {due.text}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/30 px-4 py-2.5">
        <span className="flex-1 truncate text-[11px] text-gray-400 dark:text-gray-500">
          {t.completion_date ? `Completes ${formatDateLong(t.completion_date)}` : 'No completion date'}
        </span>
        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button onClick={onDone} disabled={archiving} title="Mark as done"
            className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-40 transition-colors">
            <Check size={12} /> Done
          </button>
          <button onClick={onEdit} title="Edit" aria-label="Edit"
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} title="Delete" aria-label="Delete"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
