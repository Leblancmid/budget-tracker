import { TrendingUp, TrendingDown, Wallet, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboard } from '@/hooks/useDashboard'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, MONTHS } from '@/utils/format'

export function Dashboard() {
  const { stats, month, year, loading, setMonth, setYear } = useDashboard()

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - 2 + i
    return { value: y, label: String(y) }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Overview for {MONTHS[month - 1]} {year}</p>
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
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Income"
            value={formatCurrency(stats?.total_income ?? 0)}
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            bg="bg-emerald-50"
            textColor="text-emerald-700"
          />
          <StatCard
            label="Total Expense"
            value={formatCurrency(stats?.total_expense ?? 0)}
            icon={<TrendingDown className="h-5 w-5 text-red-600" />}
            bg="bg-red-50"
            textColor="text-red-700"
          />
          <StatCard
            label="Balance"
            value={formatCurrency(stats?.balance ?? 0)}
            icon={<Wallet className="h-5 w-5 text-indigo-600" />}
            bg="bg-indigo-50"
            textColor={(stats?.balance ?? 0) >= 0 ? 'text-indigo-700' : 'text-red-700'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
            <Link to="/transactions" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto scrollbar-thin max-h-72">
            {stats?.recent_transactions.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No transactions yet.</p>
            )}
            {stats?.recent_transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                    style={{ backgroundColor: tx.category.color }}
                  >
                    {tx.category.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{tx.description || tx.category.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <span className={['text-sm font-semibold', tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'].join(' ')}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Expenses by Category</h2>
          </div>
          <div className="flex flex-col gap-3 p-5 overflow-y-auto scrollbar-thin max-h-72">
            {stats?.expense_by_category.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">No expenses recorded.</p>
            )}
            {stats?.expense_by_category.map((item) => {
              const totalExpense = stats.total_expense || 1
              const pct = Math.round((Number(item.total) / totalExpense) * 100)
              return (
                <div key={item.category_id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.category.color }} />
                      <span className="text-sm text-gray-700">{item.category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{pct}%</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
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
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Monthly Trend — {year}</h2>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-emerald-600 uppercase">Income</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-red-500 uppercase">Expense</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Array.from({ length: 12 }, (_, mi) => {
                  const m = mi + 1
                  const inc = stats?.monthly_trend.find((t) => t.month === m && t.type === 'income')
                  const exp = stats?.monthly_trend.find((t) => t.month === m && t.type === 'expense')
                  if (!inc && !exp) return null
                  const net = (Number(inc?.total ?? 0) - Number(exp?.total ?? 0))
                  return (
                    <tr key={m} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-700">
                        {MONTHS[mi]}
                        {m === month && <Badge variant="neutral" className="ml-2">current</Badge>}
                      </td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-medium">{formatCurrency(inc?.total ?? 0)}</td>
                      <td className="px-5 py-3 text-right text-red-600 font-medium">{formatCurrency(exp?.total ?? 0)}</td>
                      <td className={['px-5 py-3 text-right font-semibold', net >= 0 ? 'text-emerald-700' : 'text-red-700'].join(' ')}>
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
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={['text-xl font-bold mt-0.5', textColor].join(' ')}>{value}</p>
      </div>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gray-100" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-20 rounded bg-gray-100" />
          <div className="h-5 w-28 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  )
}
