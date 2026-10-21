import { CalendarClock, Coins, User } from 'lucide-react'
import type { StatusFilter } from './salesUtils'

/** Shortcut chips for accounts and trades that need action. Renders nothing when all is well. */
export function NeedsAttention({ counts, goldAwaiting, onShowStatus, onShowGold }: {
  counts: Record<StatusFilter, number>
  goldAwaiting: number
  onShowStatus: (f: StatusFilter) => void
  onShowGold: () => void
}) {
  if (counts.overdue + counts.due + counts.pricing + goldAwaiting + counts.not_paid <= 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Needs attention</span>
      {counts.overdue > 0 && (
        <button onClick={() => onShowStatus('overdue')}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
          <CalendarClock size={12} /> {counts.overdue} overdue payment{counts.overdue !== 1 ? 's' : ''}
        </button>
      )}
      {counts.due > 0 && (
        <button onClick={() => onShowStatus('due')}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
          <CalendarClock size={12} /> {counts.due} due within 7 days
        </button>
      )}
      {counts.pricing > 0 && (
        <button onClick={() => onShowStatus('pricing')}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
          <User size={12} /> {counts.pricing} account{counts.pricing !== 1 ? 's' : ''} awaiting pricing
        </button>
      )}
      {goldAwaiting > 0 && (
        <button onClick={onShowGold}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
          <Coins size={12} /> {goldAwaiting} gold trade{goldAwaiting !== 1 ? 's' : ''} awaiting pricing
        </button>
      )}
      {counts.not_paid > 0 && (
        <button onClick={() => onShowStatus('not_paid')}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          {counts.not_paid} not paid
        </button>
      )}
    </div>
  )
}
