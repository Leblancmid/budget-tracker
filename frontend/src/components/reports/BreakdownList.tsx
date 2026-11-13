import type { ReactNode } from 'react'

export interface BreakdownItem {
  key: string
  label: string
  /** The period we're in now (highlighted) */
  current: boolean
  /** Nothing happened in it (dimmed) */
  empty: boolean
  /** The main figure, already formatted and coloured */
  amount: ReactNode
  /** One small line under the label (e.g. revenue · cost) */
  detail: ReactNode
  /** One small line under the amount (e.g. margin) */
  aside?: ReactNode
}

/**
 * Phones: a report's breakdown as a list (period and its main figure, the rest in a small line
 * underneath), since the table's four or more money columns don't fit a phone's width.
 */
export function BreakdownList({ items, total, currentClass }: {
  items: BreakdownItem[]
  total: { amount: ReactNode; detail: ReactNode }
  /** Background for the current period's row */
  currentClass: string
}) {
  return (
    <ul className="divide-y divide-gray-50 dark:divide-gray-700/40">
      {items.map((it) => (
        <li key={it.key} className={['flex items-center justify-between gap-3 px-4 py-3', it.current ? currentClass : '', it.empty ? 'opacity-50' : ''].join(' ')}>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
              {it.label}
              {it.current && <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-900/60 dark:text-gray-300">current</span>}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">{it.detail}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="whitespace-nowrap text-sm font-semibold">{it.amount}</p>
            {it.aside && <p className="whitespace-nowrap text-[10px] text-gray-400 dark:text-gray-500">{it.aside}</p>}
          </div>
        </li>
      ))}
      <li className="flex items-center justify-between gap-3 border-t-2 border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/40">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</p>
          <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">{total.detail}</p>
        </div>
        <p className="shrink-0 whitespace-nowrap text-sm font-semibold">{total.amount}</p>
      </li>
    </ul>
  )
}
