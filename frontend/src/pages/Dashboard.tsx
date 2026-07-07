import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboard } from '@/hooks/useDashboard'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, MONTHS, buildYearOptions } from '@/utils/format'
import { Amt } from '@/context/AmountVisibilityContext'

export function Dashboard() {
  const { stats, month, year, loading, setMonth, setYear } = useDashboard()

  const yearOptions   = buildYearOptions()
  const totalIncome   = stats?.total_income  ?? 0
  const totalExpense  = stats?.total_expense ?? 0
  const net           = totalIncome - totalExpense
  const netPositive   = net >= 0

  return (
    <div className="flex flex-col gap-6">

      {/* Month / Year picker */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {MONTHS[month - 1]} {year}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Monthly overview</p>
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

      {/* Hero summary banner */}
      {loading ? (
        <div className="h-32 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 p-6 shadow-lg shadow-indigo-500/20">
          <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative grid grid-cols-3 gap-4">
            {/* Income */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-400/30">
                  <TrendingUp className="h-3 w-3 text-emerald-300" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">Income</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1 truncate">
                <Amt value={formatCurrency(totalIncome)} />
              </p>
            </div>

            {/* Expense */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-red-400/30">
                  <TrendingDown className="h-3 w-3 text-red-300" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">Expense</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1 truncate">
                <Amt value={formatCurrency(totalExpense)} />
              </p>
            </div>

            {/* Net */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <div className={['flex h-5 w-5 items-center justify-center rounded-md', netPositive ? 'bg-white/20' : 'bg-red-400/30'].join(' ')}>
                  <Minus className={['h-3 w-3', netPositive ? 'text-white/80' : 'text-red-300'].join(' ')} />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">Net</span>
              </div>
              <p className={['text-2xl font-bold mt-1 truncate', netPositive ? 'text-white' : 'text-red-300'].join(' ')}>
                {netPositive ? '+' : ''}<Amt value={formatCurrency(net)} />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cards row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Transactions */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
            <Link
              to="/transactions"
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
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
              stats!.recent_transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm"
                    style={{ backgroundColor: tx.category.color }}
                  >
                    {tx.category.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {tx.description || tx.category.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(tx.date)}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={['text-sm font-semibold', tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                      {tx.type === 'income' ? '+' : '-'}<Amt value={formatCurrency(tx.amount)} />
                    </span>
                    <span className={['text-[10px] font-medium mt-0.5 px-1.5 py-0.5 rounded-full', tx.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'].join(' ')}>
                      {tx.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Expenses by Category */}
        <Card className="flex flex-col">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Expenses by Category</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{MONTHS[month - 1]} {year}</p>
          </div>

          <div className="flex flex-col gap-4 p-5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800" />
                </div>
              ))
            ) : (stats?.expense_by_category.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No expenses recorded.</p>
            ) : (
              stats!.expense_by_category.map((item) => {
                const pct = Math.round((Number(item.total) / (stats!.total_expense || 1)) * 100)
                return (
                  <div key={item.category_id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-6 w-6 shrink-0 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: item.category.color }}
                        >
                          {item.category.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.category.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{pct}%</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          <Amt value={formatCurrency(item.total)} />
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: item.category.color }}
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
                  <th className="px-5 py-3 text-right text-xs font-semibold text-emerald-600 uppercase tracking-wide dark:text-emerald-500">Income</th>
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
                  const rowNet = Number(inc?.total ?? 0) - Number(exp?.total ?? 0)
                  const isCurrent = m === month
                  return (
                    <tr
                      key={m}
                      className={[
                        'transition-colors',
                        isCurrent
                          ? 'bg-indigo-50/60 dark:bg-indigo-900/10'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/40',
                      ].join(' ')}
                    >
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300 font-medium">
                        <div className="flex items-center gap-2">
                          {MONTHS[mi]}
                          {isCurrent && (
                            <Badge variant="neutral" className="text-[10px]">current</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-medium dark:text-emerald-400">
                        <Amt value={formatCurrency(inc?.total ?? 0)} />
                      </td>
                      <td className="px-5 py-3 text-right text-red-500 font-medium dark:text-red-400">
                        <Amt value={formatCurrency(exp?.total ?? 0)} />
                      </td>
                      <td className={['px-5 py-3 text-right font-semibold', rowNet >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                        {rowNet >= 0 ? '+' : ''}<Amt value={formatCurrency(rowNet)} />
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
