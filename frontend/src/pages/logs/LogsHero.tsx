import { Activity, ScrollText } from 'lucide-react'
import type { LogEntry } from '@/api/logs'
import { MODULE_STYLES, type LogSummary } from './logFormat'

export function LogsHero({ summary, shownCount, totalCount, userName }: {
  summary: LogSummary
  shownCount: number
  totalCount: number
  /** Badge text when filtered to one user; null for everyone */
  userName: string | null
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
      <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-400/20">
                <ScrollText className="h-3.5 w-3.5 text-slate-200" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Entries</span>
              {userName !== null && (
                <span className="text-[10px] font-semibold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">{userName}</span>
              )}
            </div>
            <p className="text-4xl font-bold text-slate-100">{shownCount.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">of {totalCount.toLocaleString()} across all users</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Today',     value: summary.todayCount },
              { label: 'This week', value: summary.weekCount },
              { label: 'Edits',     value: summary.edits },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/5 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-100">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 14-day activity */}
        <div className="flex flex-col justify-end gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><Activity size={11} /> Last 14 days</span>
            {summary.top && (
              <span>Busiest: <b className="text-slate-300">{MODULE_STYLES[summary.top[0] as LogEntry['module']]?.label ?? summary.top[0]}</b> ({summary.top[1]})</span>
            )}
          </div>
          <div className="flex h-24 items-end gap-1">
            {summary.days.map((d) => (
              <div key={d.key} className="flex h-full flex-1 flex-col justify-end" title={`${d.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}: ${d.count} entr${d.count === 1 ? 'y' : 'ies'}`}>
                <span className={['w-full rounded-t-md transition-all duration-700', d.count ? 'bg-violet-400/80' : 'bg-white/10'].join(' ')} style={{ height: d.count ? `${Math.max(8, (d.count / summary.dayMax) * 100)}%` : '4px' }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>{summary.days[0].date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  )
}
