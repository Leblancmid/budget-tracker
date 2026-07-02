import { useState } from 'react'
import { TrendingUp, Wallet, Coins, DollarSign, PiggyBank } from 'lucide-react'
import { useMasterDashboard } from '@/hooks/useMasterDashboard'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/utils/format'

const USD_RATE_KEY = 'master_account_usd_rate'
const PHP_RATE_KEY = 'master_account_php_rate'

function getSaved(key: string, fallback: number): number {
  const v = localStorage.getItem(key)
  return v ? parseFloat(v) || fallback : fallback
}

export default function MasterDashboard() {
  const { stats, loading } = useMasterDashboard()

  const [usdRate, setUsdRate]   = useState(() => getSaved(USD_RATE_KEY, 0.22))
  const [phpRate, setPhpRate]   = useState(() => getSaved(PHP_RATE_KEY, 61))
  const [usdInput, setUsdInput] = useState(() => String(getSaved(USD_RATE_KEY, 0.22)))
  const [phpInput, setPhpInput] = useState(() => String(getSaved(PHP_RATE_KEY, 61)))

  const handleUsdRate = (val: string) => {
    setUsdInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0) { setUsdRate(n); localStorage.setItem(USD_RATE_KEY, String(n)) }
  }

  const handlePhpRate = (val: string) => {
    setPhpInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0) { setPhpRate(n); localStorage.setItem(PHP_RATE_KEY, String(n)) }
  }

  const rawGold        = stats?.total_price ?? 0
  const totalCost      = rawGold / 1_000_000
  const usdAmount      = totalCost * usdRate
  const phpAmount      = usdAmount * phpRate

  const rawCurrentGold = stats?.gold_stash ?? 0
  const goldBase       = rawCurrentGold / 1_000_000
  const goldUsd        = goldBase * usdRate
  const goldPhp        = goldUsd * phpRate

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Master Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Consolidated view across all modules — all time</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-36 rounded-2xl animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="h-36 rounded-2xl animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="h-36 rounded-2xl animate-pulse bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-44 rounded-2xl animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="h-44 rounded-2xl animate-pulse bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">

          {/* Primary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Overall Profit */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 p-6 shadow-lg">
              <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-white/5" />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-violet-100">Overall Profit</span>
                </div>
                <div>
                  <p className={['text-3xl font-bold', (stats?.overall_profit ?? 0) >= 0 ? 'text-white' : 'text-red-200'].join(' ')}>
                    {formatCurrency(stats?.overall_profit ?? 0)}
                  </p>
                  <p className="text-xs text-violet-200/80 mt-1">Business + Daily Expenses</p>
                </div>
              </div>
            </div>

            {/* Overall Balance */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 p-6 shadow-lg">
              <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-white/5" />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Wallet className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-indigo-100">Overall Balance</span>
                </div>
                <div>
                  <p className={['text-3xl font-bold', (stats?.overall_balance ?? 0) >= 0 ? 'text-white' : 'text-red-200'].join(' ')}>
                    {formatCurrency(stats?.overall_balance ?? 0)}
                  </p>
                  <p className="text-xs text-indigo-200/80 mt-1">Business + Daily Expenses</p>
                </div>
              </div>
            </div>

            {/* Savings Balance */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 p-6 shadow-lg">
              <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-white/5" />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <PiggyBank className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-emerald-100">Savings Balance</span>
                </div>
                <div>
                  <p className={['text-3xl font-bold', (stats?.savings_balance ?? 0) >= 0 ? 'text-white' : 'text-red-200'].join(' ')}>
                    {formatCurrency(stats?.savings_balance ?? 0)}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">CIMB · Maribank · GCash</p>
                </div>
              </div>
            </div>

          </div>

          {/* Gold Conversion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Current Gold */}
            <Card className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Current Gold</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Rucoy Online</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-700/50">
                  {rawCurrentGold.toLocaleString()} G
                </span>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700/60 pt-4">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  ₱{goldPhp.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                  ${goldUsd.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </p>
              </div>
            </Card>

            {/* Total Account Cost */}
            <Card className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/30">
                    <DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Total Account Cost</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Rucoy Accounts</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-700/50">
                  {rawGold.toLocaleString()} G
                </span>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700/60 pt-4">
                <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">
                  ₱{phpAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                  ${usdAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-24">USD Conversion</span>
                  <div className="flex-1" />
                  <input
                    type="number" min="0.000001" step="0.01" value={usdInput}
                    onChange={(e) => handleUsdRate(e.target.value)}
                    className="w-20 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-900 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-24">PHP Conversion</span>
                  <div className="flex-1" />
                  <input
                    type="number" min="0.01" step="0.01" value={phpInput}
                    onChange={(e) => handlePhpRate(e.target.value)}
                    className="w-20 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-900 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>
            </Card>

          </div>
        </div>
      )}
    </div>
  )
}
