import { Amt } from '@/components/ui/Amt'
import type { LogEntry } from '@/api/logs'
import { fieldMeta, formatValue } from './logFormat'

/** Field-by-field before → after for an "edited" entry. */
export function ChangeList({ entry }: { entry: LogEntry }) {
  const rows = Object.entries(entry.changes ?? {})
  if (rows.length === 0) return null
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700/60 divide-y divide-gray-100 dark:divide-gray-700/60">
      {rows.map(([field, { before, after }]) => {
        const { label, kind } = fieldMeta(field, entry)
        const isMoney = kind === 'php' || kind === 'usd'
        const b = formatValue(before, kind)
        const a = formatValue(after, kind)
        return (
          <div key={field} className="grid grid-cols-[minmax(90px,140px)_1fr] sm:grid-cols-[160px_1fr] items-start gap-2 px-3 py-1.5 bg-gray-50/60 dark:bg-gray-800/30">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate" title={label}>{label}</span>
            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs min-w-0">
              <span className="text-red-500/90 dark:text-red-400/90 line-through decoration-red-300/60 break-all">
                {isMoney && b !== '—' ? <Amt value={b} /> : b}
              </span>
              <span className="text-gray-300 dark:text-gray-600">→</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 break-all">
                {isMoney && a !== '—' ? <Amt value={a} /> : a}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
