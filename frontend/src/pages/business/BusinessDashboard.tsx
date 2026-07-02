import { TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/utils/format'

export default function BusinessDashboard() {
  const { stats, loading } = useBusinessDashboard()

  const profit = stats?.total_profit ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Business overview — all time</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Profit"
            value={formatCurrency(profit)}
            icon={<BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
            bg="bg-teal-50 dark:bg-teal-900/20"
            textColor={profit >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-red-700 dark:text-red-400'}
          />
          <StatCard
            label="Total Income"
            value={formatCurrency(stats?.total_income ?? 0)}
            icon={<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            bg="bg-emerald-50 dark:bg-emerald-900/20"
            textColor="text-emerald-700 dark:text-emerald-400"
          />
          <StatCard
            label="Total Expense"
            value={formatCurrency(stats?.total_expense ?? 0)}
            icon={<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />}
            bg="bg-red-50 dark:bg-red-900/20"
            textColor="text-red-700 dark:text-red-400"
          />
          <StatCard
            label="Balance"
            value={formatCurrency(stats?.balance ?? 0)}
            icon={<Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
            bg="bg-indigo-50 dark:bg-indigo-900/20"
            textColor={(stats?.balance ?? 0) >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-red-700 dark:text-red-400'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/business/transactions', label: 'Transactions', desc: 'Account, Gold & Expense entries' },
          { to: '/business/categories', label: 'Categories', desc: 'Organise your business categories' },
          { to: '/business/budgets', label: 'Budgets', desc: 'Set monthly expense budgets' },
        ].map(({ to, label, desc }) => (
          <Link key={to} to={to} className="block">
            <Card className="px-5 py-4 hover:shadow-md transition-shadow cursor-pointer">
              <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">{label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
            </Card>
          </Link>
        ))}
      </div>
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
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium dark:text-gray-400 truncate">{label}</p>
        <p className={['text-lg font-bold mt-0.5 truncate', textColor].join(' ')}>{value}</p>
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
