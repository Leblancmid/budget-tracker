import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTHS } from '@/utils/format'

interface MonthNavProps {
  month: number // 1–12
  year: number
  onChange: (month: number, year: number) => void
}

/** ‹ October 2026 › with a "This month" shortcut when viewing another month. */
export function MonthNav({ month, year, onChange }: MonthNavProps) {
  const now = new Date()
  const isCurrent = month === now.getMonth() + 1 && year === now.getFullYear()

  const shift = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1)
    onChange(d.getMonth() + 1, d.getFullYear())
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <button onClick={() => shift(-1)} title="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-l-xl text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[9.5rem] px-2 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">
          {MONTHS[month - 1]} {year}
        </span>
        <button onClick={() => shift(1)} title="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-r-xl text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
      {!isCurrent && (
        <button onClick={() => onChange(now.getMonth() + 1, now.getFullYear())}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 transition-colors">
          This month
        </button>
      )}
    </div>
  )
}
