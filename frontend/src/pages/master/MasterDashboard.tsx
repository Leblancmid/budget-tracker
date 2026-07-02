import { TrendingUp, TrendingDown, Wallet, Coins } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMasterDashboard } from '@/hooks/useMasterDashboard'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/utils/format'

export default function MasterDashboard() {
  const { stats, loading } = useMasterDashboard()

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">Master overview — all time</p>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Overall Profit"
            value={formatCurrency(stats?.overall_profit ?? 0)}
            sub="Business + Daily Expenses"
            icon={<TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
            bg="bg-violet-50 dark:bg-violet-900/20"
            textColor={(stats?.overall_profit ?? 0) >= 0 ? 'text-violet-700 dark:text-violet-400' : 'text-red-700 dark:text-red-400'}
          />
          <StatCard
            label="Overall Balance"
            value={formatCurrency(stats?.overall_balance ?? 0)}
            sub="Business + Daily + Savings"
            icon={<Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
            bg="bg-indigo-50 dark:bg-indigo-900/20"
            textColor={(stats?.overall_balance ?? 0) >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-red-700 dark:text-red-400'}
          />
          <StatCard
            label="Gold Stash"
            value={`${(stats?.gold_stash ?? 0).toLocaleString()} G`}
            sub="Rucoy Online"
            icon={<Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            bg="bg-amber-50 dark:bg-amber-900/20"
            textColor="text-amber-700 dark:text-amber-400"
          />
          <StatCard
            label="Total Price"
            value={formatCurrency(stats?.total_price ?? 0)}
            sub="Rucoy Accounts"
            icon={<TrendingDown className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
            bg="bg-teal-50 dark:bg-teal-900/20"
            textColor="text-teal-700 dark:text-teal-400"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BreakdownCard
          label="Business"
          value={formatCurrency(stats?.business_profit ?? 0)}
          positive={(stats?.business_profit ?? 0) >= 0}
          to="/business"
          color="teal"
        />
        <BreakdownCard
          label="Daily Expenses"
          value={formatCurrency(stats?.daily_balance ?? 0)}
          positive={(stats?.daily_balance ?? 0) >= 0}
          to="/"
          color="indigo"
        />
        <BreakdownCard
          label="Savings Balance"
          value={formatCurrency(stats?.savings_balance ?? 0)}
          positive={(stats?.savings_balance ?? 0) >= 0}
          to="/master/savings"
          color="violet"
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon, bg, textColor }: {
  label: string; value: string; sub: string; icon: React.ReactNode; bg: string; textColor: string
}) {
  return (
    <Card className="flex items-center gap-4 px-5 py-4">
      <div className={['flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', bg].join(' ')}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium dark:text-gray-400 truncate">{label}</p>
        <p className={['text-xl font-bold mt-0.5', textColor].join(' ')}>{value}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 truncate">{sub}</p>
      </div>
    </Card>
  )
}

const COLOR_MAP = {
  teal:   { bg: 'bg-teal-50 dark:bg-teal-900/20',     text: 'text-teal-700 dark:text-teal-400',     link: 'text-teal-600 hover:text-teal-800 dark:text-teal-400'   },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', link: 'text-indigo-600 hover:text-indigo-800 dark:text-indigo-400' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', link: 'text-violet-600 hover:text-violet-800 dark:text-violet-400' },
}

function BreakdownCard({ label, value, positive, to, color }: {
  label: string; value: string; positive: boolean; to: string; color: keyof typeof COLOR_MAP
}) {
  const c = COLOR_MAP[color]
  return (
    <Link to={to} className="block">
      <Card className={['px-5 py-4 hover:shadow-md transition-shadow', c.bg].join(' ')}>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className={['text-lg font-bold', positive ? c.text : 'text-red-700 dark:text-red-400'].join(' ')}>{value}</p>
      </Card>
    </Link>
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
