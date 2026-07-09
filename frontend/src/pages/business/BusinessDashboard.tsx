import { TrendingUp, TrendingDown, ArrowRight, BarChart3, Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, MONTHS, buildYearOptions } from '@/utils/format'
import { Amt } from '@/context/AmountVisibilityContext'
import { isBusinessIncome } from '@/utils/business'

const TYPE_LABELS: Record<string, string> = { account: 'Account', gold: 'Gold', expense: 'Item' }
const TYPE_COLORS: Record<string, string>  = { account: '#6366f1', gold: '#f59e0b', expense: '#ef4444' }

export default function BusinessDashboard() {
  const { stats, month, year, loading, setMonth, setYear } = useBusinessDashboard()

  const yearOptions    = buildYearOptions()
  const profit            = stats?.initial_profit  ?? 0
  const archivedProfit    = stats?.total_profit    ?? 0
  const archivedIncome    = stats?.archived_income  ?? 0
  const archivedExpense   = stats?.archived_expense ?? 0
  const totalIncome       = stats?.total_income    ?? 0
  const totalExpense      = stats?.total_expense   ?? 0

  return (
    <div className="flex flex-col gap-6">

      {/* Picker */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {MONTHS[month - 1]} {year}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Business overview</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
            className="w-36"
          />
          <Select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            options={yearOptions}
            className="w-24"
          />
        </div>
      </div>

      {/* Hero banner */}
      {loading ? (
        <div className="h-36 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

          <div className="relative flex flex-col gap-4">
            {/* Primary: profit */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-400/20">
                  <BarChart3 className="h-3.5 w-3.5 text-teal-400" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Profit</span>
              </div>
              <p className={['text-3xl font-bold', archivedProfit >= 0 ? 'text-teal-300' : 'text-red-400'].join(' ')}>
                {archivedProfit >= 0 ? '' : '−'}<Amt value={formatCurrency(Math.abs(archivedProfit))} />
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Briefcase className="h-3 w-3" />
                Initial profit:
                <span className="font-semibold text-slate-400"><Amt value={formatCurrency(profit)} /></span>
              </p>
            </div>

            {/* Sub-stats */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                  <TrendingUp className="h-3.5 w-3.5 text-slate-300" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Income</p>
                  <p className="text-sm font-bold text-emerald-400"><Amt value={formatCurrency(totalIncome)} /></p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Initial: <span className="font-semibold text-emerald-500/70"><Amt value={formatCurrency(archivedIncome)} /></span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                  <TrendingDown className="h-3.5 w-3.5 text-slate-300" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Expense</p>
                  <p className="text-sm font-bold text-red-400"><Amt value={formatCurrency(totalExpense)} /></p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Initial: <span className="font-semibold text-red-400/70"><Amt value={formatCurrency(archivedExpense)} /></span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Middle cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Transactions */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
            <Link
              to="/business/transactions"
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                  <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-2.5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              ))
            ) : (stats?.recent_transactions.length ?? 0) === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">No transactions yet.</p>
            ) : (
              stats!.recent_transactions.map((tx) => {
                const isIncome = isBusinessIncome(tx)
                const color    = TYPE_COLORS[tx.type] ?? '#14b8a6'
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {TYPE_LABELS[tx.type]?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {tx.description || TYPE_LABELS[tx.type]}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(tx.date)}</p>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className={['text-sm font-bold', isIncome ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                        {isIncome ? '+' : '−'}<Amt value={formatCurrency(tx.amount)} />
                      </span>
                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">
                        {TYPE_LABELS[tx.type]}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Expenses by Type */}
        <Card className="flex flex-col">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Expenses by Type</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{MONTHS[month - 1]} {year}</p>
          </div>

          <div className="flex flex-col gap-4 p-5">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800" />
                </div>
              ))
            ) : (stats?.expense_by_type.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No expenses recorded.</p>
            ) : (
              stats!.expense_by_type.map((item) => {
                const pct   = Math.round((Number(item.total) / (stats!.total_expense || 1)) * 100)
                const color = TYPE_COLORS[item.type] ?? '#14b8a6'
                const label = TYPE_LABELS[item.type] ?? item.type
                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold"
                          style={{ backgroundColor: color }}
                        >
                          {label.charAt(0)}
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{pct}%</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          <Amt value={formatCurrency(item.total)} />
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>

      {/* Monthly Trend */}
      {(stats?.monthly_trend.length ?? 0) > 0 && (
        <Card>
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Monthly Trend</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{year} — all recorded months</p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Month</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-teal-600 uppercase tracking-wide dark:text-teal-500">Income</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-red-500 uppercase tracking-wide dark:text-red-400">Expense</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {Array.from({ length: 12 }, (_, mi) => {
                  const m   = mi + 1
                  const inc = stats?.monthly_trend.find((t) => t.month === m && t.type === 'income')
                  const exp = stats?.monthly_trend.find((t) => t.month === m && t.type === 'expense')
                  if (!inc && !exp) return null
                  const net        = Number(inc?.total ?? 0) - Number(exp?.total ?? 0)
                  const isCurrent  = m === month
                  return (
                    <tr
                      key={m}
                      className={[
                        'transition-colors',
                        isCurrent
                          ? 'bg-teal-50/60 dark:bg-teal-900/10'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/40',
                      ].join(' ')}
                    >
                      <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          {MONTHS[mi]}
                          {isCurrent && <Badge variant="neutral" className="text-[10px]">current</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-teal-600 font-medium dark:text-teal-400">
                        <Amt value={formatCurrency(inc?.total ?? 0)} />
                      </td>
                      <td className="px-5 py-3 text-right text-red-500 font-medium dark:text-red-400">
                        <Amt value={formatCurrency(exp?.total ?? 0)} />
                      </td>
                      <td className={['px-5 py-3 text-right font-semibold', net >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                        {net >= 0 ? '+' : ''}<Amt value={formatCurrency(net)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
