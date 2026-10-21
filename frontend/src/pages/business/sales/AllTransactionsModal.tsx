import { useState } from 'react'
import { Coins } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency, formatDate, paginateLocally } from '@/utils/format'
import { isBusinessIncome } from '@/utils/business'
import type { BusinessTransaction } from '@/types'
import { BIZ_TYPE_COLORS, BIZ_TYPE_LABELS } from './salesUtils'

/** Every business transaction, newest first. Mount it only while open so it starts on page 1. */
export function AllTransactionsModal({ onClose, loading, transactions, onReclassify }: {
  onClose: () => void
  loading: boolean
  /** Sorted newest first */
  transactions: BusinessTransaction[]
  onReclassify: (tx: BusinessTransaction) => void
}) {
  const [page, setPage] = useState(1)
  const { paginated, meta } = paginateLocally(transactions, page, 10)

  return (
    <Modal open onClose={onClose} title="All Transactions" size="xl">
      <div className="flex flex-col gap-0 -mx-6 -my-5">
        {loading ? (
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3.5 animate-pulse">
                <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-2.5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">No transactions yet.</p>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
              {paginated.map((tx) => {
                const isIncome = isBusinessIncome(tx)
                const isSold   = tx.archived_at != null
                const color    = BIZ_TYPE_COLORS[tx.type] ?? '#14b8a6'
                return (
                  <div key={tx.id} className={['group flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors', isSold ? 'opacity-60' : ''].join(' ')}>
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {BIZ_TYPE_LABELS[tx.type]?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {tx.description || BIZ_TYPE_LABELS[tx.type]}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatDate(tx.date)}{isSold && ' · Sold'}
                      </p>
                    </div>
                    {!isSold && tx.type !== 'gold' && (
                      <button
                        onClick={() => onReclassify(tx)}
                        title="Mark as Gold"
                        className="md:opacity-0 md:group-hover:opacity-100 flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 transition-all dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40"
                      >
                        <Coins size={11} />
                        Gold
                      </button>
                    )}
                    <div className="flex flex-col items-end shrink-0">
                      <span className={['text-sm font-bold', isIncome ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                        {isIncome ? '+' : '−'}<Amt value={formatCurrency(tx.amount)} />
                      </span>
                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">
                        {BIZ_TYPE_LABELS[tx.type]}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-6 py-3 border-t border-gray-50 dark:border-gray-700/40">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
