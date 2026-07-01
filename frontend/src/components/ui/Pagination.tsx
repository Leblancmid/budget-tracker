import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { PaginationMeta } from '@/types'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (!meta) return null

  const { current_page, last_page, from, to, total } = meta

  if (last_page <= 1) return null

  const pages = buildPageRange(current_page, last_page)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3">
      <p className="text-sm text-gray-500 dark:text-gray-500">
        {from ?? 0}–{to ?? 0} of {total} results
      </p>

      <div className="flex items-center gap-1">
        <NavBtn onClick={() => onPageChange(1)} disabled={current_page === 1} title="First">
          <ChevronsLeft className="h-4 w-4" />
        </NavBtn>
        <NavBtn onClick={() => onPageChange(current_page - 1)} disabled={current_page === 1} title="Previous">
          <ChevronLeft className="h-4 w-4" />
        </NavBtn>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400 dark:text-gray-600 select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={[
                'h-8 min-w-[2rem] rounded-lg px-2.5 text-sm font-medium transition-colors',
                p === current_page
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              {p}
            </button>
          )
        )}

        <NavBtn onClick={() => onPageChange(current_page + 1)} disabled={current_page === last_page} title="Next">
          <ChevronRight className="h-4 w-4" />
        </NavBtn>
        <NavBtn onClick={() => onPageChange(last_page)} disabled={current_page === last_page} title="Last">
          <ChevronsRight className="h-4 w-4" />
        </NavBtn>
      </div>
    </div>
  )
}

function NavBtn({ onClick, disabled, title, children }: {
  onClick: () => void
  disabled: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-400 dark:hover:bg-gray-800"
    >
      {children}
    </button>
  )
}

function buildPageRange(current: number, last: number): (number | '...')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]

  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < last - 2) pages.push('...')
  pages.push(last)

  return pages
}
