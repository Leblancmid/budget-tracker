import { Banknote, Coins, RotateCcw } from 'lucide-react'
import { formatDateLong } from '@/utils/format'
import type { Trade } from '@/types'
import { StatusPill } from './StatusPill'
import { formatAmount } from './tradeFormat'

export function ArchivedTradeRow({ trade: t, onRestore }: { trade: Trade; onRestore: () => void }) {
  const isKks = t.status === 'kks'
  return (
    <div className="group flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
      <span className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl opacity-70', isKks ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'].join(' ')}>
        {isKks ? <Coins size={15} /> : <Banknote size={15} />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{t.description || (isKks ? 'KKS trade' : 'Cash trade')}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
          <StatusPill status={t.status} />
          {t.payment_method && <span className="capitalize">{t.payment_method}</span>}
          <span>· done {formatDateLong(t.archived_at ?? t.completion_date)}</span>
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatAmount(t)}</span>
      <button onClick={onRestore} title="Restore" aria-label="Restore"
        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 md:opacity-0 md:group-hover:opacity-100 transition-all">
        <RotateCcw size={14} />
      </button>
    </div>
  )
}
