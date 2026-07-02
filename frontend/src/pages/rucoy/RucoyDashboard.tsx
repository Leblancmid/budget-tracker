import { useEffect, useMemo, useState } from 'react'
import { Coins, ArrowLeftRight, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { useRucoyDashboard } from '@/hooks/useRucoyDashboard'
import { useTrades } from '@/hooks/useTrades'
import { useGoldLogs } from '@/hooks/useGoldLogs'
import { tradesApi } from '@/api/rucoy'
import { formatCurrency } from '@/utils/format'
import type { Trade, TradeCurrency, TradeStatus } from '@/types'

const CURRENCY_SYMBOLS: Record<TradeCurrency, string> = { PHP: '₱', USD: '$', EUR: '€' }

function formatTradeAmount(status: TradeStatus, amount: string, currency: TradeCurrency | null) {
  if (status === 'kks') return `+${Number(amount).toLocaleString()} G`
  const symbol = currency ? CURRENCY_SYMBOLS[currency] : '₱'
  if (symbol === '₱') return `+${formatCurrency(parseFloat(amount))}`
  return `+${symbol}${Number(amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function StatCard({ icon, label, value, bg, textColor }: {
  icon: React.ReactNode
  label: string
  value: string | number
  bg: string
  textColor: string
}) {
  return (
    <Card className="flex items-center gap-4 px-5 py-4">
      <div className={['flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', bg].join(' ')}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium dark:text-gray-400">{label}</p>
        <p className={['text-xl font-bold mt-0.5', textColor].join(' ')}>{value}</p>
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

export default function RucoyDashboard() {
  const { stats, loading: statsLoading, error: statsError } = useRucoyDashboard()
  const { trades, loading: tradesLoading } = useTrades()
  const { logs, loading: logsLoading } = useGoldLogs()
  const [archivedTrades, setArchivedTrades] = useState<Trade[]>([])

  useEffect(() => {
    tradesApi.getArchived().then(setArchivedTrades).catch(() => {})
  }, [])

  const recentActivity = useMemo(() => {
    const tradeItems = trades.map((t) => ({
      key: `trade-${t.id}`,
      iconBg: t.status === 'kks' ? 'bg-amber-500' : 'bg-emerald-500',
      iconChar: t.status === 'kks' ? 'K' : 'C',
      title: t.description || (t.status === 'kks' ? 'KKS Trade' : 'CASH Trade'),
      subtitle: t.status === 'kks' ? 'KKS' : `CASH · ${t.payment_method ?? ''}`.trimEnd().replace(/·\s*$/, ''),
      amount: formatTradeAmount(t.status, t.amount, t.currency),
      amountColor: t.status === 'kks'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400',
      date: t.created_at,
    }))

    const archivedItems = archivedTrades.map((t) => ({
      key: `archived-${t.id}`,
      iconBg: 'bg-gray-400 dark:bg-gray-600',
      iconChar: '✓',
      title: t.description || (t.status === 'kks' ? 'KKS Trade' : 'CASH Trade'),
      subtitle: `Archived · ${t.status === 'kks' ? 'KKS' : 'CASH'}`,
      amount: formatTradeAmount(t.status, t.amount, t.currency),
      amountColor: 'text-gray-400 dark:text-gray-500',
      date: t.archived_at ?? t.created_at,
    }))

    const logItems = logs.map((l) => ({
      key: `log-${l.id}`,
      iconBg: l.type === 'add' ? 'bg-emerald-500' : 'bg-red-500',
      iconChar: l.type === 'add' ? '+' : '−',
      title: l.description || (l.type === 'add' ? 'Gold Added' : 'Gold Sold'),
      subtitle: 'Gold Stash',
      amount: `${l.type === 'add' ? '+' : '-'}${Number(l.amount).toLocaleString()} G`,
      amountColor: l.type === 'add'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400',
      date: l.created_at,
    }))

    return [...tradeItems, ...archivedItems, ...logItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
  }, [trades, archivedTrades, logs])

  const activityLoading = tradesLoading || logsLoading

  if (statsError) return (
    <div className="text-red-500 text-center py-10">{statsError}</div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Rucoy Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your Rucoy Online assets</p>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={<Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            label="Total Gold"
            value={`${Number(stats?.total_gold ?? 0).toLocaleString()} G`}
            bg="bg-amber-50 dark:bg-amber-900/20"
            textColor="text-amber-700 dark:text-amber-400"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
            label="Trades Gold"
            value={`${Number(stats?.kks_gold ?? 0).toLocaleString()} G`}
            bg="bg-orange-50 dark:bg-orange-900/20"
            textColor="text-orange-700 dark:text-orange-400"
          />
          <StatCard
            icon={<Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
            label="Gold Stash"
            value={`${Number(stats?.manual_gold ?? 0).toLocaleString()} G`}
            bg="bg-yellow-50 dark:bg-yellow-900/20"
            textColor="text-yellow-700 dark:text-yellow-400"
          />
          <StatCard
            icon={<ArrowLeftRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
            label="Total Trades"
            value={stats?.trade_count ?? 0}
            bg="bg-indigo-50 dark:bg-indigo-900/20"
            textColor="text-indigo-700 dark:text-indigo-400"
          />
        </div>
      )}

      <Card className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
          <div className="flex items-center gap-3">
            <Link to="/rucoy/golds" className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium dark:text-amber-400 dark:hover:text-amber-300">
              Golds <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link to="/rucoy/trades" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium dark:text-indigo-400 dark:hover:text-indigo-300">
              Trades <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-50 overflow-y-auto scrollbar-thin max-h-72 dark:divide-gray-700/40">
          {activityLoading && (
            <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">Loading…</p>
          )}
          {!activityLoading && recentActivity.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">No activity yet.</p>
          )}
          {!activityLoading && recentActivity.map((item) => (
            <div key={item.key} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors dark:hover:bg-gray-800/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className={['flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold', item.iconBg].join(' ')}>
                  {item.iconChar}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">{item.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.date)}</p>
                </div>
              </div>
              <span className={['text-sm font-semibold whitespace-nowrap ml-3', item.amountColor].join(' ')}>
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
