import { TrendingUp, TrendingDown, ArrowRight, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, MONTHS, buildYearOptions } from '@/utils/format'
import { isBusinessIncome } from '@/utils/business'

const TYPE_LABELS: Record<string, string> = { account: 'Account', gold: 'Gold', expense: 'Item' }
const TYPE_COLORS: Record<string, string>  = { account: '#6366f1', gold: '#f59e0b', expense: '#ef4444' }

export default function BusinessDashboard() {
  const { stats, month, year, loading, setMonth, setYear } = useBusinessDashboard()

  const yearOptions = buildYearOptions()

  const profit = stats?.total_profit ?? 0

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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Profit"
            value={formatCurrency(profit)}
            icon={<BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
            bg="bg-teal-50 dark:bg-teal-900/20"
            textColor={profit >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-red-700 dark:text-red-400'}
            subLabel="Initial Profit"
            subValue={formatCurrency(stats?.initial_profit ?? 0)}
            subTextColor={(stats?.initial_profit ?? 0) >= 0 ? 'text-teal-600 dark:text-teal-500' : 'text-red-600 dark:text-red-400'}
          />
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
        {/* Recent Transactions */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
            <Link to="/business/transactions" className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium dark:text-teal-400 dark:hover:text-teal-300">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto scrollbar-thin max-h-72 dark:divide-gray-700/40">
            {(stats?.recent_transactions.length ?? 0) === 0 && (
              <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">No transactions yet.</p>
            )}
            {stats?.recent_transactions.map((tx) => {
              const isIncome = isBusinessIncome(tx)
              return (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors dark:hover:bg-gray-800/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                      style={{ backgroundColor: TYPE_COLORS[tx.type] ?? '#14b8a6' }}
                    >
                      {TYPE_LABELS[tx.type]?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
                        {tx.description || TYPE_LABELS[tx.type]}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <span className={['text-sm font-semibold', isIncome ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Expenses by Type */}
        <Card className="flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Expenses by Type</h2>
          </div>
          <div className="flex flex-col gap-4 p-5 overflow-y-auto scrollbar-thin max-h-72">
            {(stats?.expense_by_type.length ?? 0) === 0 && (
              <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">No expenses recorded.</p>
            )}
            {stats?.expense_by_type.map((item) => {
              const totalExpense = stats.total_expense || 1
              const pct = Math.round((Number(item.total) / totalExpense) * 100)
              const color = TYPE_COLORS[item.type] ?? '#14b8a6'
              const label = TYPE_LABELS[item.type] ?? item.type
              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{pct}%</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
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
                  <th className="px-5 py-3 text-right text-xs font-medium text-teal-600 uppercase dark:text-teal-500">Income</th>
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
                  const net = Number(inc?.total ?? 0) - Number(exp?.total ?? 0)
                  return (
                    <tr key={m} className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-800/40">
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {MONTHS[mi]}
                        {m === month && <Badge variant="neutral" className="ml-2">current</Badge>}
                      </td>
                      <td className="px-5 py-3 text-right text-teal-600 font-medium dark:text-teal-400">{formatCurrency(inc?.total ?? 0)}</td>
                      <td className="px-5 py-3 text-right text-red-600 font-medium dark:text-red-400">{formatCurrency(exp?.total ?? 0)}</td>
                      <td className={['px-5 py-3 text-right font-semibold', net >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-red-700 dark:text-red-400'].join(' ')}>
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

function StatCard({ label, value, icon, bg, textColor, subLabel, subValue, subTextColor }: {
  label: string; value: string; icon: React.ReactNode; bg: string; textColor: string
  subLabel?: string; subValue?: string; subTextColor?: string
}) {
  return (
    <Card className="flex flex-col gap-4 px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', bg].join(' ')}>
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className={['text-2xl font-bold leading-none tracking-tight truncate', textColor].join(' ')}>{value}</p>
        {subLabel && subValue && (
          <p className={['text-xs font-medium truncate', subTextColor ?? 'text-gray-400 dark:text-gray-500'].join(' ')}>
            {subLabel}: {subValue}
          </p>
        )}
      </div>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 animate-pulse dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="h-7 w-32 rounded bg-gray-100 dark:bg-gray-800" />
    </div>
  )
}
