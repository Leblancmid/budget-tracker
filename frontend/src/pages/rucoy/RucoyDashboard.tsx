import { Coins, ArrowLeftRight, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useRucoyDashboard } from '@/hooks/useRucoyDashboard'

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      </div>
    </Card>
  )
}

export default function RucoyDashboard() {
  const { stats, loading, error } = useRucoyDashboard()

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-gray-400">Loading…</div>
  )
  if (error) return (
    <div className="text-red-500 text-center py-10">{error}</div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Rucoy Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your Rucoy Online assets</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Coins}
          label="Total Gold"
          value={Number(stats?.total_gold ?? 0).toLocaleString()}
          color="bg-amber-500"
        />
        <StatCard
          icon={ArrowLeftRight}
          label="Active Trades"
          value={stats?.trade_count ?? 0}
          color="bg-indigo-500"
        />
        <StatCard
          icon={Users}
          label="Accounts for Sale"
          value={stats?.account_count ?? 0}
          color="bg-emerald-500"
        />
      </div>

      {/* Gold breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-xl p-3 bg-yellow-400">
            <Coins size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Gold Stash</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {Number(stats?.manual_gold ?? 0).toLocaleString()} <span className="text-sm font-semibold text-amber-500">G</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Manually added gold</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-xl p-3 bg-orange-400">
            <ArrowLeftRight size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">KKS Trades</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {Number(stats?.kks_gold ?? 0).toLocaleString()} <span className="text-sm font-semibold text-orange-500">G</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Gold from KKS trades</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
