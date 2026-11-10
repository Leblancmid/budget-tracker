import type { ReactNode } from 'react'

/** Shared chart pieces: the hover tooltip and the legend. */

export interface TooltipRow {
  label: string
  value: string
  /** Swatch class (bg-*) for the series; none for totals */
  dot?: string
  strong?: boolean
}

/** Hover card next to the pointer column; flips to the left in the right half so it never overflows. */
export function ChartTooltip({ x, width, title, rows }: { x: number; width: number; title: string; rows: TooltipRow[] }) {
  const right = x > width / 2
  return (
    <div
      role="status"
      className="pointer-events-none absolute top-1 z-10 min-w-[11rem] rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95"
      style={right ? { right: width - x + 12 } : { left: x + 12 }}
    >
      <p className="mb-1 font-semibold text-gray-800 dark:text-gray-100">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className={['flex items-center justify-between gap-4', r.strong ? 'mt-1 border-t border-gray-100 pt-1 font-semibold text-gray-900 dark:border-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'].join(' ')}>
          <span className="flex items-center gap-1.5">{r.dot && <span className={['h-2 w-2 rounded-sm', r.dot].join(' ')} />}{r.label}</span>
          <span className="tabular-nums">{r.value}</span>
        </p>
      ))}
    </div>
  )
}

/** Legend row above a chart (always shown for two or more series). */
export function Legend({ items }: { items: { label: string; dot?: string; mark?: ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          {i.mark ?? <span className={['h-2.5 w-2.5 rounded-sm', i.dot].join(' ')} />}
          {i.label}
        </span>
      ))}
    </div>
  )
}
