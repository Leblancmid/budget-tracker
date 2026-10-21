import { ChevronLeft, ChevronRight } from 'lucide-react'

/** "1–10 of 24 trades" with ‹ 1 2 3 › page buttons. */
export function TradesPager({ page, totalPages, from, to, total, onPageChange }: {
  page: number
  totalPages: number
  from: number
  to: number
  total: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-gray-400 dark:text-gray-500">{from}–{to} of {total} trades</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onPageChange(p)}
            className={['flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors', p === page ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'].join(' ')}>
            {p}
          </button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
