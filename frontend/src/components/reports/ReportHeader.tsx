import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import type { ReportPeriod } from '@/types'
import { PERIOD_TABS } from '@/utils/reportPeriods'

/** Title, period tabs, ‹ range › stepper and CSV export shared by the report pages. */
export function ReportHeader({ title, subtitle, period, onPeriodChange, rangeLabel, onShift, onExport, canExport }: {
  title: string
  subtitle: string
  period: ReportPeriod
  onPeriodChange: (period: ReportPeriod) => void
  rangeLabel: string
  onShift: (delta: number) => void
  onExport: () => void
  canExport: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          {PERIOD_TABS.map(({ value, label }) => (
            <button key={value} onClick={() => onPeriodChange(value)}
              className={['rounded-lg px-3 py-1.5 text-sm font-semibold transition-all', period === value ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'].join(' ')}>
              {label}
            </button>
          ))}
        </div>
        {period !== 'yearly' && (
          <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <button onClick={() => onShift(-1)} aria-label="Previous" className="flex h-9 w-9 items-center justify-center rounded-l-xl text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"><ChevronLeft size={16} /></button>
            <span className="min-w-[8.5rem] px-2 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">{rangeLabel}</span>
            <button onClick={() => onShift(1)} aria-label="Next" className="flex h-9 w-9 items-center justify-center rounded-r-xl text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"><ChevronRight size={16} /></button>
          </div>
        )}
        <button onClick={onExport} disabled={!canExport}
          className="hidden md:flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>
    </div>
  )
}
