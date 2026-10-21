import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, Coins, Download, Scale, Search, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pagination } from '@/components/ui/Pagination'
import { useGolds } from '@/hooks/useGolds'
import { useGoldLogs } from '@/hooks/useGoldLogs'
import { useRucoyDashboard } from '@/hooks/useRucoyDashboard'
import { useTrades } from '@/hooks/useTrades'
import { toast } from '@/lib/toast'
import { formatDateLong, paginateLocally } from '@/utils/format'
import { exportCsv } from '@/utils/csv'
import { CorrectStashModal } from './summary/CorrectStashModal'
import { GoldFlowCard } from './summary/GoldFlowCard'
import { HistoryEntryRow } from './summary/HistoryEntryRow'
import { SummaryHero } from './summary/SummaryHero'
import {
  ENTRY_STYLE, TYPE_FILTERS, fmtG, goldFlow, logDelta, mmFeeTotal, typeOfEntry,
  type MmFeePeriod, type TypeFilter, type UnifiedEntry,
} from './summary/summaryUtils'

/** Rucoy → Summary: total gold, this month's flow and every gold movement. */
export default function RucoySummary() {
  const { totalGold, loading, error, refetch: refetchGolds } = useGolds()
  const { logs, loading: logsLoading, cancel: cancelLog, refetch: refetchLogs } = useGoldLogs()
  const { trades, loading: tradesLoading } = useTrades()
  const { stats } = useRucoyDashboard()

  const [fixOpen, setFixOpen]       = useState(false)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [page, setPage]             = useState(1)
  const [mmFeePeriod, setMmFeePeriod] = useState<MmFeePeriod>('monthly')

  const mmFeePeriodTotal = useMemo(() => mmFeeTotal(logs, mmFeePeriod), [logs, mmFeePeriod])
  const flow = useMemo(() => goldFlow(logs), [logs])

  // ── History ──
  const allEntries = useMemo((): UnifiedEntry[] => {
    const logEntries: UnifiedEntry[] = logs.map((l) => ({ kind: 'log', log: l, date: l.created_at }))
    const tradeEntries: UnifiedEntry[] = trades.map((t) => ({ kind: 'trade', trade: t, date: t.created_at }))
    return [...logEntries, ...tradeEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [logs, trades])

  const typeCounts = useMemo(() => {
    const c: Record<TypeFilter, number> = { all: allEntries.length, add: 0, sell: 0, fee: 0, kks: 0, cash: 0 }
    for (const e of allEntries) c[typeOfEntry(e)]++
    return c
  }, [allEntries])

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allEntries.filter((e) => {
      const desc = e.kind === 'log' ? (e.log.description ?? '') : (e.trade.description ?? '')
      if (q && !desc.toLowerCase().includes(q)) return false
      return typeFilter === 'all' || typeOfEntry(e) === typeFilter
    })
  }, [allEntries, typeFilter, search])

  const { paginated: paginatedEntries, meta } = paginateLocally(filteredEntries, page, 15)

  // Group the current page by day
  const groups = useMemo(() => {
    const out: { day: string; items: UnifiedEntry[]; net: number }[] = []
    for (const e of paginatedEntries) {
      const day = new Date(e.date).toDateString()
      let g = out[out.length - 1]
      if (!g || g.day !== day) { g = { day, items: [], net: 0 }; out.push(g) }
      g.items.push(e)
      if (e.kind === 'log') g.net += logDelta(e.log)
      else if (e.trade.status === 'kks') g.net += Number(e.trade.amount)
    }
    return out
  }, [paginatedEntries])

  const [cancelTarget, setCancelTarget] = useState<number | null>(null)
  const [cancelling, setCancelling]     = useState(false)

  const handleCancelLog = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelLog(cancelTarget)
      await refetchGolds()
      toast.success('Entry cancelled.')
    } catch {
      toast.error('Failed to cancel entry.')
    } finally {
      setCancelling(false)
      setCancelTarget(null)
    }
  }

  const handleExport = () => exportCsv('golds', logs.map((l) => ({
    date: l.created_at, type: l.type, amount: l.amount, description: l.description ?? '', cancelled: l.cancelled_at ? 'yes' : '',
  })))

  return (
    <div className="flex flex-col gap-5">

      {error && <div className="text-red-500 text-sm text-center py-2">{error}</div>}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Rucoy</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">Gold stash, trades and every gold movement</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFixOpen(true)} title="Set the stash to the gold you actually have"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Scale size={15} /> Correct stash
          </button>
          <Link to="/rucoy/trades" className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeftRight size={15} /> Trades
          </Link>
          <Link to="/business/transactions" className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors">
            <ShoppingBag size={15} /> Add / sell gold
          </Link>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="h-48 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <SummaryHero
          totalGold={totalGold}
          tradesGold={Number(stats?.kks_gold ?? 0)}
          tradeCount={stats?.trade_count ?? 0}
          logCount={logs.length}
          accountCost={Number(stats?.account_total_cost ?? 0)}
          accountsToPay={Number(stats?.accounts_to_pay ?? 0)}
          mmFeeTotal={mmFeePeriodTotal}
          mmFeePeriod={mmFeePeriod}
          onMmFeePeriodChange={setMmFeePeriod}
        />
      )}

      <GoldFlowCard flow={flow} loading={logsLoading} />

      {/* ── History ────────────────────────────────────────────────── */}
      <Card className="flex flex-col">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">History</h2>
            <span className="rounded-full bg-gray-100 dark:bg-gray-700/60 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {filteredEntries.length}{filteredEntries.length !== allEntries.length && ` of ${allEntries.length}`}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search…"
                  className="w-44 rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
              <div className="hidden md:block">
                <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleExport}>Export</Button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map((t) => {
              const on = typeFilter === t
              const style = t === 'all' ? null : ENTRY_STYLE[t]
              return (
                <button key={t} onClick={() => { setTypeFilter(t); setPage(1) }}
                  className={[
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                    on ? (style ? style.pill + ' ring-1 ring-current/30' : 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900') : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                  ].join(' ')}>
                  {style && <style.Icon size={11} />}
                  {style ? style.label : 'All'}
                  <span className="opacity-60">{typeCounts[t]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {logsLoading || tradesLoading ? (
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 h-3 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <Coins className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {search || typeFilter !== 'all' ? 'No entries match your filters.' : 'No gold movements yet.'}
            </p>
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <div key={g.day}>
                <div className="flex items-center justify-between gap-3 bg-gray-50/80 dark:bg-gray-800/40 px-5 py-2 border-y border-gray-100 dark:border-gray-700/60">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{formatDateLong(g.items[0].date)}</span>
                  {g.net !== 0 && (
                    <span className={['text-[11px] font-semibold', g.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                      {g.net >= 0 ? '+' : '−'}{fmtG(Math.abs(g.net))}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {g.items.map((entry) => (
                    <HistoryEntryRow
                      key={`${entry.kind}-${entry.kind === 'log' ? entry.log.id : entry.trade.id}`}
                      entry={entry}
                      onCancel={setCancelTarget}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700/40">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      {fixOpen && (
        <CorrectStashModal
          totalGold={totalGold}
          onClose={() => setFixOpen(false)}
          onCorrected={() => Promise.all([refetchGolds(), refetchLogs()])}
        />
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelLog}
        loading={cancelling}
        title="Cancel Entry"
        message="Cancel this entry? Its gold is reversed in your stash (put back for a sale, taken out for an add), and the line stays in the history marked as cancelled."
        confirmLabel="Cancel Entry"
      />
    </div>
  )
}
