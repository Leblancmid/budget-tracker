import { Card } from '@/components/ui/Card'
import { MONTHS } from '@/utils/format'
import { fmtG, shortG, type GoldFlow } from './summaryUtils'

/** This month's added / sold / fees / net, and a 30-day in/out chart. */
export function GoldFlowCard({ flow, loading }: { flow: GoldFlow; loading: boolean }) {
  const dayMax = Math.max(1, ...flow.days.map((d) => Math.max(d.inflow, d.outflow)))

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Gold flow</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{MONTHS[new Date().getMonth()]} totals · daily movement over the last 30 days</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> In</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" /> Out</span>
        </div>
      </div>
      {loading ? (
        <div className="m-5 h-40 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-5 p-5">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {[
              { label: 'Added',   value: flow.added, cls: 'text-emerald-600 dark:text-emerald-400', sign: '+' },
              { label: 'Sold',    value: flow.sold,  cls: 'text-red-500 dark:text-red-400',         sign: '−' },
              { label: 'MM fees', value: flow.fees,  cls: 'text-violet-600 dark:text-violet-400',   sign: '+' },
              { label: 'Net',     value: flow.net,   cls: flow.net >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400', sign: flow.net >= 0 ? '+' : '−' },
            ].map(({ label, value, cls, sign }) => (
              <div key={label} className="flex items-baseline justify-between gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
                <span className={['text-sm font-bold', cls].join(' ')}>{sign}{fmtG(Math.abs(value))}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex h-40 items-center gap-px">
              {flow.days.map((d) => (
                <div key={d.key} className="group relative flex h-full flex-1 flex-col"
                  title={`${d.label.toLocaleDateString('en', { month: 'short', day: 'numeric' })}: +${fmtG(d.inflow)} / −${fmtG(d.outflow)}`}>
                  <div className="flex flex-1 items-end justify-center">
                    <span className="w-full max-w-[12px] rounded-t-sm bg-emerald-500/80 group-hover:bg-emerald-500" style={{ height: `${(d.inflow / dayMax) * 100}%` }} />
                  </div>
                  <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex flex-1 items-start justify-center">
                    <span className="w-full max-w-[12px] rounded-b-sm bg-red-400/80 group-hover:bg-red-400" style={{ height: `${(d.outflow / dayMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
              <span>{flow.days[0].label.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
              <span>max {shortG(dayMax)} G / day</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
