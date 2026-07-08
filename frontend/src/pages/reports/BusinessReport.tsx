import { useMemo, useState } from 'react'
import { BarChart2, TrendingUp, TrendingDown, Download, Calendar } from 'lucide-react'
import { useReport, type ReportPeriod } from '@/hooks/useReport'
import { Pagination } from '@/components/ui/Pagination'
import { Card } from '@/components/ui/Card'
import { Amt } from '@/context/AmountVisibilityContext'
import { formatCurrency, paginateLocally, MONTHS } from '@/utils/format'
import { exportCsv } from '@/utils/csv'

const PERIOD_TABS: { value: ReportPeriod; label: string }[] = [
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly'  },
]

const PER_PAGE_OPTIONS = [
  { value: '10', label: '10 / page' },
  { value: '25', label: '25 / page' },
  { value: '50', label: '50 / page' },
]

const now = new Date()
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const y = now.getFullYear() - i
  return { value: String(y), label: String(y) }
})
const MONTH_OPTIONS = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))

export default function BusinessReport() {
  const [period,  setPeriod]  = useState<ReportPeriod>('monthly')
  const [year,    setYear]    = useState(now.getFullYear())
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [page,    setPage]    = useState(1)
  const [perPage, setPerPage] = useState(10)

  const { data, loading } = useReport('business', period, year, month)

  const { paginated, meta } = useMemo(
    () => paginateLocally(data?.rows ?? [], page, perPage),
    [data, page, perPage],
  )

  const totals     = data?.totals
  const isPositive = (totals?.profit ?? 0) >= 0

  const handleExport = () => {
    if (!data?.rows.length) return
    exportCsv(`business-report-${period}-${year}`, data.rows.map(r => ({
      period:  r.label,
      income:  r.income,
      expense: r.expense,
      profit:  r.profit ?? 0,
    })))
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

        <div className="relative flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-400/20">
                <BarChart2 className="h-3.5 w-3.5 text-teal-400" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Profit</span>
            </div>
            {loading ? (
              <div className="h-9 w-40 rounded-lg bg-white/10 animate-pulse" />
            ) : (
              <p className={['text-3xl font-bold', isPositive ? 'text-teal-300' : 'text-red-400'].join(' ')}>
                <Amt value={formatCurrency(totals?.profit ?? 0)} />
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                <TrendingUp className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Income</p>
                {loading
                  ? <div className="h-4 w-24 rounded bg-white/10 animate-pulse mt-0.5" />
                  : <p className="text-base font-bold text-emerald-400"><Amt value={formatCurrency(totals?.income ?? 0)} /></p>
                }
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                <TrendingDown className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Expense</p>
                {loading
                  ? <div className="h-4 w-24 rounded bg-white/10 animate-pulse mt-0.5" />
                  : <p className="text-base font-bold text-red-400"><Amt value={formatCurrency(totals?.expense ?? 0)} /></p>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <Card className="flex flex-col">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">

          {/* Period tabs */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {PERIOD_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setPeriod(value); setPage(1) }}
                className={[
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                  period === value
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Year */}
            {period !== 'yearly' && (
              <select
                value={String(year)}
                onChange={e => { setYear(Number(e.target.value)); setPage(1) }}
                className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
              >
                {YEAR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}

            {/* Month (weekly only) */}
            {period === 'weekly' && (
              <select
                value={String(month)}
                onChange={e => { setMonth(Number(e.target.value)); setPage(1) }}
                className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
              >
                {MONTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}

            {/* Per page */}
            <select
              value={String(perPage)}
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
            >
              {PER_PAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Export */}
            <button
              onClick={handleExport}
              disabled={!data?.rows.length}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/40">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Period</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Income</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Expense</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-3.5"><div className="h-3.5 w-36 rounded bg-gray-100 dark:bg-gray-800" /></td>
                    <td className="px-5 py-3.5 text-right"><div className="h-3.5 w-24 rounded bg-gray-100 dark:bg-gray-800 ml-auto" /></td>
                    <td className="px-5 py-3.5 text-right"><div className="h-3.5 w-24 rounded bg-gray-100 dark:bg-gray-800 ml-auto" /></td>
                    <td className="px-5 py-3.5 text-right"><div className="h-3.5 w-24 rounded bg-gray-100 dark:bg-gray-800 ml-auto" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-14 text-center text-sm text-gray-400 dark:text-gray-500">
                    No data for this period.
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) => {
                  const profit = row.profit ?? 0
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                          <span className="font-medium text-gray-800 dark:text-gray-200">{row.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        <Amt value={formatCurrency(row.income)} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-red-500 dark:text-red-400">
                        <Amt value={formatCurrency(row.expense)} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold">
                        <span className={profit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'}>
                          <Amt value={formatCurrency(profit)} />
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>

            {!loading && (data?.rows.length ?? 0) > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 font-semibold">
                  <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</td>
                  <td className="px-5 py-3 text-right text-sm text-emerald-600 dark:text-emerald-400">
                    <Amt value={formatCurrency(totals?.income ?? 0)} />
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-red-500 dark:text-red-400">
                    <Amt value={formatCurrency(totals?.expense ?? 0)} />
                  </td>
                  <td className={['px-5 py-3 text-right text-sm', isPositive ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                    <Amt value={formatCurrency(totals?.profit ?? 0)} />
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {meta.last_page > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/60">
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  )
}
