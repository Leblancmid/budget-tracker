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
    </div>
  )
}
