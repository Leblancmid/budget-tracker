import type { ReactNode } from 'react'
import { Undo2 } from 'lucide-react'
import type { GoldLog } from '@/types'
import { formatTime } from '@/utils/format'
import { Gold } from '@/components/ui/Gold'
import { ENTRY_STYLE, logDelta, typeOfEntry, type UnifiedEntry } from './summaryUtils'

/** One gold log or trade in the history, with an Undo button for active logs. */
export function HistoryEntryRow({ entry, onCancel }: { entry: UnifiedEntry; onCancel: (log: GoldLog) => void }) {
  const style     = ENTRY_STYLE[typeOfEntry(entry)]
  const cancelled = entry.kind === 'log' && !!entry.log.cancelled_at
  const desc      = entry.kind === 'log' ? entry.log.description : entry.trade.description

  let amount: ReactNode
  if (entry.kind === 'trade') {
    amount = entry.trade.status === 'kks'
      ? <span className="text-amber-600 dark:text-amber-400">+<Gold value={Number(entry.trade.amount)} /></span>
      : <span className="text-gray-400 dark:text-gray-500">Cash trade</span>
  } else {
    const d = logDelta(entry.log)
    amount = cancelled
      ? <span className="text-gray-400 line-through"><Gold value={Math.abs(Number(entry.log.amount))} /></span>
      : <span className={d >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>{d >= 0 ? '+' : '−'}<Gold value={Math.abs(d)} /></span>
  }

  return (
    <div className={['group flex items-center gap-3 px-4 py-3 sm:px-5 transition-colors', cancelled ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'].join(' ')}>
      <span className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', cancelled ? 'bg-gray-100 text-gray-400 dark:bg-gray-800' : style.tile].join(' ')}>
        <style.Icon size={15} />
      </span>
      <div className="flex-1 min-w-0">
        <p className={['text-sm font-medium text-gray-800 dark:text-gray-100 truncate', cancelled ? 'line-through' : ''].join(' ')}>
          {desc || <span className="text-gray-400 dark:text-gray-500">{style.label}</span>}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-gray-400 dark:text-gray-500">
          <span className={['rounded-full px-1.5 py-0.5 text-[10px] font-semibold', style.pill].join(' ')}>{style.label}</span>
          {formatTime(entry.date)}
          {cancelled && <span className="font-semibold text-gray-500">· Undone</span>}
        </p>
      </div>
      <span className="shrink-0 text-sm font-bold whitespace-nowrap">{amount}</span>
      {entry.kind === 'log' && !cancelled ? (
        <button onClick={() => onCancel(entry.log)} title="Undo" aria-label="Undo"
          className="flex h-10 w-10 shrink-0 items-center justify-center gap-1 rounded-lg text-xs sm:h-7 sm:w-auto sm:px-2 font-semibold text-gray-400 hover:bg-amber-50 hover:text-amber-600 dark:text-gray-500 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-within:opacity-100 transition-all">
          <Undo2 size={15} className="sm:h-[13px] sm:w-[13px]" /> <span className="hidden sm:inline">Undo</span>
        </button>
      ) : <span className="w-10 shrink-0 sm:w-16" />}
    </div>
  )
}
