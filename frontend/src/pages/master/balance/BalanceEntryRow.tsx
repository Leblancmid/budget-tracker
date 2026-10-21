import { Link } from 'react-router-dom'
import { ExternalLink, Pencil, Receipt, Trash2 } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import { formatDate } from '@/utils/format'
import { colorOf, fmtIn, fmtPhp, iconOf } from '@/utils/balanceAccounts'
import type { BalanceAccountConfig, BalanceEntry } from '@/types'

/** One add / sell in the history. Entries made by a daily transaction are edited from Transactions. */
export function BalanceEntryRow({ entry: e, account: a, phpRate, onEdit, onDelete }: {
  entry: BalanceEntry
  account: BalanceAccountConfig | undefined
  phpRate: number
  onEdit: () => void
  onDelete: () => void
}) {
  const c     = colorOf(a?.color ?? 'slate')
  const Icon  = iconOf(a?.icon ?? 'wallet')
  const isAdd = e.type === 'add'

  return (
    <div className="group flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
      <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', c.iconTile].join(' ')}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={['shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', c.badge].join(' ')}>{a?.name ?? e.account}</span>
          <p className="truncate text-sm text-gray-700 dark:text-gray-200">
            {e.description || <span className="text-gray-400 dark:text-gray-500">{isAdd ? 'Added' : 'Sold'}</span>}
          </p>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1.5">
          {formatDate(e.date)} · {isAdd ? 'Add' : 'Sell'}
          {e.transaction_id && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">
              <Receipt size={9} /> From Transactions
            </span>
          )}
        </p>
      </div>
      {e.transaction_id ? (
        // Owned by a daily transaction — changing it here would make the two drift apart
        <Link to="/transactions" title="Edit this in Transactions"
          className="md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20">
          Edit in Transactions <ExternalLink size={11} />
        </Link>
      ) : (
        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} title="Edit" aria-label="Edit"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} title="Delete" aria-label="Delete"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex flex-col items-end shrink-0">
        <span className={['text-sm font-bold whitespace-nowrap', isAdd ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
          {isAdd ? '+' : '−'}<Amt value={fmtIn(a, parseFloat(e.amount))} />
        </span>
        {a?.currency === 'USD' && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">≈ <Amt value={fmtPhp(parseFloat(e.amount) * phpRate)} /></span>
        )}
      </div>
    </div>
  )
}
