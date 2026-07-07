import { useState } from 'react'
import { TrendingUp, Coins, DollarSign, PiggyBank, SlidersHorizontal } from 'lucide-react'
import { useMasterDashboard } from '@/hooks/useMasterDashboard'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/utils/format'
import { Amt } from '@/context/AmountVisibilityContext'

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

  const overallProfit  = stats?.overall_profit  ?? 0
  const savingsBalance = stats?.savings_balance  ?? 0

  if (loading) return (
    <div className="flex flex-col gap-4">
      <div className="h-40 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-36 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
        <div className="h-36 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="h-16 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

        <div className="relative flex flex-col gap-4">
          {/* Overall Profit */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-400/20">
                <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Overall Profit</span>
            </div>
            <p className={['text-3xl font-bold', overallProfit >= 0 ? 'text-violet-300' : 'text-red-400'].join(' ')}>
              <Amt value={formatCurrency(overallProfit)} />
            </p>
            <p className="text-xs text-slate-500 mt-1">Business + Daily Expenses</p>
          </div>

          {/* Sub-stats */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                <PiggyBank className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Savings</p>
                <p className={['text-base font-bold', savingsBalance >= 0 ? 'text-slate-200' : 'text-red-400'].join(' ')}>
                  <Amt value={formatCurrency(savingsBalance)} />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                <Coins className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Gold Stash</p>
                <p className="text-base font-bold text-amber-400">
                  {rawCurrentGold.toLocaleString()} G
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gold cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Current Gold */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 bg-amber-50/60 dark:bg-amber-900/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Current Gold</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">Rucoy Online — Gold Stash</p>
            </div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
              {rawCurrentGold.toLocaleString()} G
            </span>
          </div>
          <div className="px-5 py-5">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              ₱{goldPhp.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              ${goldUsd.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </p>
          </div>
        </Card>

        {/* Total Account Cost */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 bg-teal-50/60 dark:bg-teal-900/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
              <DollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Total Account Cost</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">Rucoy Accounts — All time</p>
            </div>
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 shrink-0">
              {rawGold.toLocaleString()} G
            </span>
          </div>
          <div className="px-5 py-5">
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">
              ₱{phpAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              ${usdAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </p>
          </div>
        </Card>

      </div>

      {/* Exchange rate inputs */}
      <Card className="flex items-center gap-4 px-5 py-3.5">
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Exchange Rates</span>
        </div>

        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700/60" />

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">1M G =</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
              <input
                type="number" min="0.000001" step="0.01" value={usdInput}
                onChange={(e) => handleUsdRate(e.target.value)}
                className="w-20 rounded-lg border border-gray-200 bg-gray-50 pl-6 pr-2 py-1.5 text-xs text-gray-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <span className="text-xs text-gray-400">USD</span>
          </div>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">1 USD =</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₱</span>
              <input
                type="number" min="0.01" step="0.01" value={phpInput}
                onChange={(e) => handlePhpRate(e.target.value)}
                className="w-20 rounded-lg border border-gray-200 bg-gray-50 pl-6 pr-2 py-1.5 text-xs text-gray-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <span className="text-xs text-gray-400">PHP</span>
          </div>
        </div>
      </Card>

    </div>
  )
}
