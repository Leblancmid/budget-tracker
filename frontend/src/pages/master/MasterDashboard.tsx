import { useState } from 'react'
import { TrendingUp, Wallet, Coins, DollarSign } from 'lucide-react'
import { useMasterDashboard } from '@/hooks/useMasterDashboard'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/utils/format'

const RATE_KEY = 'master_account_rate'

function getSavedRate(): number {
  const v = localStorage.getItem(RATE_KEY)
  return v ? parseFloat(v) || 61 : 61
}

export default function MasterDashboard() {
  const { stats, loading } = useMasterDashboard()
  const [rate, setRate] = useState<number>(getSavedRate)
  const [rateInput, setRateInput] = useState<string>(String(getSavedRate()))

  const handleRateChange = (val: string) => {
    setRateInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0) {
      setRate(n)
      localStorage.setItem(RATE_KEY, String(n))
    }
  }

  const totalPrice   = stats?.total_price ?? 0
  const converted    = totalPrice * rate

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
            sub="Business + Daily Expenses"
            icon={<Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
            bg="bg-indigo-50 dark:bg-indigo-900/20"
            textColor={(stats?.overall_balance ?? 0) >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-red-700 dark:text-red-400'}
          />
          <StatCard
            label="Current Gold"
            value={`${(stats?.gold_stash ?? 0).toLocaleString()} G`}
            sub="Rucoy Online"
            icon={<Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            bg="bg-amber-50 dark:bg-amber-900/20"
            textColor="text-amber-700 dark:text-amber-400"
          />

          {/* Total Account Price with rate conversion */}
          <Card className="flex flex-col gap-2 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/20">
                <DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium dark:text-gray-400">Total Account Cost</p>
                <p className="text-xl font-bold mt-0.5 text-teal-700 dark:text-teal-400">
                  {formatCurrency(converted)}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-600">
                  {formatCurrency(totalPrice)} × {rate} PHP
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700/60">
              <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">PHP Rate:</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={rateInput}
                onChange={(e) => handleRateChange(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-900 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                placeholder="e.g. 61"
              />
            </div>
          </Card>
        </div>
      )}
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
