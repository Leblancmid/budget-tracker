import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboard } from '@/hooks/useDashboard'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, MONTHS, buildYearOptions } from '@/utils/format'

export function Dashboard() {
  const { stats, month, year, loading, setMonth, setYear } = useDashboard()

  const yearOptions = buildYearOptions()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Overview for {MONTHS[month - 1]} {year}</p>
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

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Income"
            value={formatCurrency(stats?.total_income ?? 0)}
            icon={<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            bg="bg-emerald-50 dark:bg-emerald-900/20"
            textColor="text-emerald-700 dark:text-emerald-400"
          />
          <StatCard
            label="Expense"
            value={formatCurrency(stats?.total_expense ?? 0)}
            icon={<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />}
            bg="bg-red-50 dark:bg-red-900/20"
            textColor="text-red-700 dark:text-red-400"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
            <Link to="/transactions" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium dark:text-indigo-400 dark:hover:text-indigo-300">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto scrollbar-thin max-h-72 dark:divide-gray-700/40">
            {stats?.recent_transactions.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">No transactions yet.</p>
            )}
            {stats?.recent_transactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors dark:hover:bg-gray-800/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                    style={{ backgroundColor: tx.category.color }}
                  >
                    {tx.category.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">{tx.description || tx.category.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <span className={['text-sm font-semibold', tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Expenses by Category</h2>
          </div>
          <div className="flex flex-col gap-3 p-5 overflow-y-auto scrollbar-thin max-h-72">
            {stats?.expense_by_category.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">No expenses recorded.</p>
            )}
            {stats?.expense_by_category.map((item) => {
              const totalExpense = stats.total_expense || 1
              const pct = Math.round((Number(item.total) / totalExpense) * 100)
              return (
                <div key={item.category_id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.category.color }} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{pct}%</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: item.category.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {(stats?.monthly_trend.length ?? 0) > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Monthly Trend — {year}</h2>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Month</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-emerald-600 uppercase dark:text-emerald-500">Income</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-red-500 uppercase dark:text-red-400">Expense</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {Array.from({ length: 12 }, (_, mi) => {
                  const m = mi + 1
                  const inc = stats?.monthly_trend.find((t) => t.month === m && t.type === 'income')
                  const exp = stats?.monthly_trend.find((t) => t.month === m && t.type === 'expense')
                  if (!inc && !exp) return null
                  const net = (Number(inc?.total ?? 0) - Number(exp?.total ?? 0))
                  return (
                    <tr key={m} className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-800/40">
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {MONTHS[mi]}
                        {m === month && <Badge variant="neutral" className="ml-2">current</Badge>}
                      </td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-medium dark:text-emerald-400">{formatCurrency(inc?.total ?? 0)}</td>
                      <td className="px-5 py-3 text-right text-red-600 font-medium dark:text-red-400">{formatCurrency(exp?.total ?? 0)}</td>
                      <td className={['px-5 py-3 text-right font-semibold', net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'].join(' ')}>
                        {net >= 0 ? '+' : ''}{formatCurrency(net)}
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

function StatCard({ label, value, icon, bg, textColor }: {
  label: string; value: string; icon: React.ReactNode; bg: string; textColor: string
}) {
  return (
    <Card className="flex items-center gap-4 px-5 py-4">
      <div className={['flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', bg].join(' ')}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium dark:text-gray-400">{label}</p>
        <p className={['text-xl font-bold mt-0.5', textColor].join(' ')}>{value}</p>
      </div>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-5 w-28 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  )
}
