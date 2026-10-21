import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, BarChart2, PiggyBank, Trophy, TrendingDown } from 'lucide-react'
import { useReport } from '@/hooks/useReport'
import { useReportRange } from '@/hooks/useReportRange'
import type { ReportRow } from '@/types'
import { Card } from '@/components/ui/Card'
import { Amt } from '@/components/ui/Amt'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatCurrency } from '@/utils/format'
import { exportCsv } from '@/utils/csv'
import { currentIndex, exportName, periodUnit, runningTotals, shortLabel } from '@/utils/reportPeriods'

const NO_ROWS: ReportRow[] = []

export default function DailyExpensesReport() {
  const { period, setPeriod, year, month, shift: shiftRange, label: rangeLabel } = useReportRange()
  const [catType, setCatType] = useState<'expense' | 'income'>('expense')

  const { data, loading } = useReport('daily-expenses', period, year, month)

  const rows    = data?.rows ?? NO_ROWS
  const totals  = data?.totals
  const income  = totals?.income ?? 0
  const expense = totals?.expense ?? 0
  const net     = totals?.net ?? income - expense
  const unit    = periodUnit(period)

  const active   = rows.filter((r) => r.income > 0 || r.expense > 0)
  const avgSpend = active.length ? expense / active.length : 0
  const savings  = income > 0 ? (net / income) * 100 : null
  const best     = active.reduce<ReportRow | null>((b, r) => (!b || (r.net ?? 0) > (b.net ?? 0) ? r : b), null)
  const worst    = active.reduce<ReportRow | null>((w, r) => (!w || (r.net ?? 0) < (w.net ?? 0) ? r : w), null)
  const maxBar   = Math.max(1, ...rows.map((r) => Math.max(r.income, r.expense)))
  const curIdx   = currentIndex(period, rows, year, month)

  // Running balance down the table
  const running = useMemo(() => runningTotals(rows, (r) => r.net ?? r.income - r.expense), [rows])

  const cats      = (data?.categories ?? []).filter((c) => c.type === catType)
  const catsTotal = cats.reduce((s, c) => s + c.total, 0)

  const handleExport = () => {
    if (!rows.length) return
    exportCsv(exportName('daily-expenses', period, year, month), rows.map((r, i) => ({
      period: r.label, income: r.income, expense: r.expense, net: r.net ?? 0, running: running[i],
    })))
  }

  return (
    <div className="flex flex-col gap-5">

      <ReportHeader
        title="Daily Expenses report"
        subtitle="Personal transactions only · Business ones are left out"
        period={period}
        onPeriodChange={setPeriod}
        rangeLabel={rangeLabel}
        onShift={shiftRange}
        onExport={handleExport}
        canExport={rows.length > 0}
      />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="h-48 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={['flex h-6 w-6 items-center justify-center rounded-lg', net >= 0 ? 'bg-indigo-400/20' : 'bg-red-400/20'].join(' ')}>
                    <BarChart2 className={['h-3.5 w-3.5', net >= 0 ? 'text-indigo-300' : 'text-red-300'].join(' ')} />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Net</span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">{rangeLabel}</span>
                </div>
                <p className={['text-4xl font-bold', net >= 0 ? 'text-indigo-200' : 'text-red-300'].join(' ')}>
                  {net >= 0 ? '+' : '−'}<Amt value={formatCurrency(Math.abs(net))} />
                </p>
                <p className="text-xs text-slate-500 mt-1">{active.length} {unit}{active.length !== 1 ? 's' : ''} with activity</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {savings != null && (
                  <div className="rounded-xl bg-white/5 px-3.5 py-2.5">
                    <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><PiggyBank size={11} /> Savings rate</p>
                    <p className={['text-lg font-bold', savings >= 0 ? 'text-emerald-300' : 'text-red-300'].join(' ')}>{Math.round(savings)}%</p>
                  </div>
                )}
                <div className="rounded-xl bg-white/5 px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Avg spend / {unit}</p>
                  <p className="text-lg font-bold text-slate-100"><Amt value={formatCurrency(avgSpend)} /></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/15"><ArrowDownLeft className="h-4 w-4 text-emerald-300" /></div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Income</p>
                  <p className="text-base font-bold text-emerald-400"><Amt value={formatCurrency(income)} /></p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-400/15"><ArrowUpRight className="h-4 w-4 text-red-300" /></div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Expense</p>
                  <p className="text-base font-bold text-red-400"><Amt value={formatCurrency(expense)} /></p>
                </div>
              </div>
              {best && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><Trophy className="h-4 w-4 text-amber-300" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Best {unit}</p>
                    <p className="truncate text-sm font-bold text-slate-100">{best.label.replace(/ \(.*\)/, '')}</p>
                    <p className="text-[11px] text-emerald-300"><Amt value={formatCurrency(best.net ?? 0)} /></p>
                  </div>
                </div>
              )}
              {worst && active.length > 1 && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><TrendingDown className="h-4 w-4 text-red-300" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Toughest {unit}</p>
                    <p className="truncate text-sm font-bold text-slate-100">{worst.label.replace(/ \(.*\)/, '')}</p>
                    <p className="text-[11px] text-red-300"><Amt value={formatCurrency(worst.net ?? 0)} /></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Chart + categories ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Income vs expense</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">By {unit} · net shown above each bar</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Income</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" /> Expense</span>
            </div>
          </div>
          {loading ? (
            <div className="m-5 h-56 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">No data for this range.</p>
          ) : (
            <div className="flex flex-col gap-2 p-5">
              <div className="flex h-56 items-end gap-1 sm:gap-2">
                {rows.map((r, i) => {
                  const n = r.net ?? r.income - r.expense
                  const empty = r.income === 0 && r.expense === 0
                  return (
                    <div key={r.label} title={`${r.label}: income ${formatCurrency(r.income)}, expense ${formatCurrency(r.expense)}, net ${formatCurrency(n)}`}
                      className={['group flex h-full flex-1 flex-col justify-end rounded-lg px-0.5 pb-0.5', i === curIdx ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''].join(' ')}>
                      {!empty && (
                        <span className={['mb-1 text-center text-[9px] font-bold', n >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'].join(' ')}>
                          {n >= 0 ? '+' : '−'}{Math.abs(n) >= 1000 ? `${(Math.abs(n) / 1000).toFixed(0)}k` : Math.round(Math.abs(n))}
                        </span>
                      )}
                      <div className="flex flex-1 items-end justify-center gap-0.5">
                        {empty ? (
                          <span className="mb-0.5 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
                        ) : (
                          <>
                            <span className="w-1/2 max-w-[18px] rounded-t-md bg-emerald-500/90 group-hover:bg-emerald-500 transition-all duration-700" style={{ height: `${(r.income / maxBar) * 100}%` }} />
                            <span className="w-1/2 max-w-[18px] rounded-t-md bg-red-400/90 group-hover:bg-red-400 transition-all duration-700" style={{ height: `${(r.expense / maxBar) * 100}%` }} />
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-1 sm:gap-2">
                {rows.map((r, i) => (
                  <span key={r.label} className={['flex-1 text-center text-[10px] font-semibold', i === curIdx ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'].join(' ')}>
                    {shortLabel(r, period, i)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Top categories</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{rangeLabel}</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
              {(['expense', 'income'] as const).map((t) => (
                <button key={t} onClick={() => setCatType(t)}
                  className={['rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors', catType === t ? (t === 'income' ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-900 dark:text-emerald-400' : 'bg-white text-red-600 shadow-sm dark:bg-gray-900 dark:text-red-400') : 'text-gray-500 dark:text-gray-400'].join(' ')}>
                  {t === 'income' ? 'Income' : 'Expense'}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="m-5 h-48 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />
          ) : cats.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">No {catType} in this range.</p>
          ) : (
            <div className="flex flex-col gap-3.5 p-5">
              {cats.slice(0, 7).map((c) => {
                const share = catsTotal > 0 ? c.total / catsTotal : 0
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <CategoryIcon category={c} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="truncate font-medium text-gray-700 dark:text-gray-200">{c.name}</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-100"><Amt value={formatCurrency(c.total)} /></span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${share * 100}%`, backgroundColor: c.color }} />
                      </div>
                      <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{Math.round(share * 100)}% · {c.count} transaction{c.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Breakdown table ────────────────────────────────────────── */}
      <Card className="flex flex-col">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Breakdown</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Running balance adds each {unit}'s net in order</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-700/60">
                {['Period', 'Income', 'Expense', 'Net', 'Running'].map((h, i) => (
                  <th key={h} className={['px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400', i === 0 ? 'text-left' : 'text-right'].join(' ')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5"><div className={['h-3.5 rounded bg-gray-100 dark:bg-gray-800', j === 0 ? 'w-36' : 'w-24 ml-auto'].join(' ')} /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-14 text-center text-sm text-gray-400 dark:text-gray-500">No data for this range.</td></tr>
              ) : (
                rows.map((r, i) => {
                  const n = r.net ?? r.income - r.expense
                  const empty = r.income === 0 && r.expense === 0
                  return (
                    <tr key={r.label} className={['transition-colors', i === curIdx ? 'bg-indigo-50/60 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30', empty ? 'opacity-50' : ''].join(' ')}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{r.label}</span>
                          {i === curIdx && <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">current</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400"><Amt value={formatCurrency(r.income)} /></td>
                      <td className="px-5 py-3 text-right font-semibold text-red-500 dark:text-red-400"><Amt value={formatCurrency(r.expense)} /></td>
                      <td className={['px-5 py-3 text-right font-semibold', n >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                        {n >= 0 ? '+' : '−'}<Amt value={formatCurrency(Math.abs(n))} />
                      </td>
                      <td className={['px-5 py-3 text-right text-xs font-semibold', running[i] >= 0 ? 'text-gray-600 dark:text-gray-300' : 'text-red-500 dark:text-red-400'].join(' ')}>
                        {running[i] >= 0 ? '' : '−'}<Amt value={formatCurrency(Math.abs(running[i]))} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {!loading && rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 font-semibold">
                  <td className="px-5 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</td>
                  <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400"><Amt value={formatCurrency(income)} /></td>
                  <td className="px-5 py-3 text-right text-red-500 dark:text-red-400"><Amt value={formatCurrency(expense)} /></td>
                  <td className={['px-5 py-3 text-right', net >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                    {net >= 0 ? '+' : '−'}<Amt value={formatCurrency(Math.abs(net))} />
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  )
}
