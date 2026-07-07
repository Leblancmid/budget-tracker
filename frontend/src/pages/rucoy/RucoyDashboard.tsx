import { useEffect, useMemo, useState } from 'react'
import { Coins, ArrowLeftRight, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { useRucoyDashboard } from '@/hooks/useRucoyDashboard'
import { useTrades } from '@/hooks/useTrades'
import { useGoldLogs } from '@/hooks/useGoldLogs'
import { tradesApi } from '@/api/rucoy'
import { formatCurrency, formatDateLong } from '@/utils/format'
import { CURRENCY_SYMBOLS } from '@/utils/rucoy'
import type { Trade, TradeCurrency, TradeStatus } from '@/types'

function formatTradeAmount(status: TradeStatus, amount: string, currency: TradeCurrency | null) {
  if (status === 'kks') return `+${Number(amount).toLocaleString()} G`
  const symbol = currency ? CURRENCY_SYMBOLS[currency] : '₱'
  if (symbol === '₱') return `+${formatCurrency(parseFloat(amount))}`
  return `+${symbol}${Number(amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function RucoyDashboard() {
  const { stats, loading: statsLoading, error: statsError } = useRucoyDashboard()
  const { trades, loading: tradesLoading } = useTrades()
  const { logs, loading: logsLoading }     = useGoldLogs()
  const [archivedTrades, setArchivedTrades] = useState<Trade[]>([])

  useEffect(() => {
    tradesApi.getArchived().then(setArchivedTrades).catch(() => {})
  }, [])

  const recentActivity = useMemo(() => {
    const tradeItems = trades.map((t) => ({
      key:         `trade-${t.id}`,
      iconBg:      t.status === 'kks' ? 'bg-amber-500' : 'bg-emerald-500',
      iconChar:    t.status === 'kks' ? 'K' : 'C',
      title:       t.description || (t.status === 'kks' ? 'KKS Trade' : 'CASH Trade'),
      subtitle:    t.status === 'kks' ? 'KKS' : `CASH · ${t.payment_method ?? ''}`.trimEnd().replace(/·\s*$/, ''),
      amount:      formatTradeAmount(t.status, t.amount, t.currency),
      amountColor: t.status === 'kks' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
      date:        t.created_at,
    }))

    const archivedItems = archivedTrades.map((t) => ({
      key:         `archived-${t.id}`,
      iconBg:      'bg-gray-400 dark:bg-gray-600',
      iconChar:    '✓',
      title:       t.description || (t.status === 'kks' ? 'KKS Trade' : 'CASH Trade'),
      subtitle:    `Archived · ${t.status === 'kks' ? 'KKS' : 'CASH'}`,
      amount:      formatTradeAmount(t.status, t.amount, t.currency),
      amountColor: 'text-gray-400 dark:text-gray-500',
      date:        t.archived_at ?? t.created_at,
    }))

    const logItems = logs.map((l) => ({
      key:         `log-${l.id}`,
      iconBg:      l.type === 'add' ? 'bg-emerald-500' : 'bg-red-500',
      iconChar:    l.type === 'add' ? '+' : '−',
      title:       l.description || (l.type === 'add' ? 'Gold Added' : 'Gold Sold'),
      subtitle:    'Gold Stash',
      amount:      `${l.type === 'add' ? '+' : '-'}${Number(l.amount).toLocaleString()} G`,
      amountColor: l.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      date:        l.created_at,
    }))

    return [...tradeItems, ...archivedItems, ...logItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
  }, [trades, archivedTrades, logs])

  const activityLoading = tradesLoading || logsLoading
  const totalGold       = Number(stats?.total_gold  ?? 0)
  const kksGold         = Number(stats?.kks_gold    ?? 0)
  const manualGold      = Number(stats?.manual_gold ?? 0)
  const tradeCount      = stats?.trade_count ?? 0

  if (statsError) return (
    <div className="text-red-500 text-center py-10">{statsError}</div>
  )

  return (
    <div className="flex flex-col gap-6">

      {/* Hero stat card */}
      {statsLoading ? (
        <div className="h-36 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

          <div className="relative flex flex-col gap-4">
            {/* Total gold */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400/20">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Gold</span>
              </div>
              <p className="text-3xl font-bold text-amber-400">
                {totalGold.toLocaleString()} <span className="text-xl font-semibold text-amber-500/70">G</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <ArrowLeftRight className="h-3 w-3" />
                {tradeCount} trade{tradeCount !== 1 ? 's' : ''} total
              </p>
            </div>

            {/* KKS / Stash split */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                  <TrendingUp className="h-3.5 w-3.5 text-slate-300" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trades Gold</p>
                  <p className="text-base font-bold text-slate-200">{kksGold.toLocaleString()} G</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                  <Coins className="h-3.5 w-3.5 text-slate-300" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Gold Stash</p>
                  <p className="text-base font-bold text-slate-200">{manualGold.toLocaleString()} G</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

{/* Recent activity */}
      <Card className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
          <div className="flex items-center gap-3">
            <Link to="/rucoy/golds" className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium dark:text-amber-400 dark:hover:text-amber-300 transition-colors">
              Golds <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link to="/rucoy/trades" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
              Trades <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
          {activityLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 w-36 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-2.5 w-24 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))
          ) : recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                <Coins className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">No activity yet.</p>
            </div>
          ) : (
            recentActivity.map((item) => (
              <div key={item.key} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm', item.iconBg].join(' ')}>
                  {item.iconChar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{item.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
                      {item.subtitle}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatDateLong(item.date)}</span>
                  </div>
                </div>
                <span className={['text-sm font-bold whitespace-nowrap', item.amountColor].join(' ')}>
                  {item.amount}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
