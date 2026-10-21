import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeftRight, ChevronDown, Coins, Download, HandCoins, Scale, Search, ShoppingBag, TrendingDown, TrendingUp, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { goldStashApi } from '@/api/rucoy'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pagination } from '@/components/ui/Pagination'
import { useGolds } from '@/hooks/useGolds'
import { useGoldLogs } from '@/hooks/useGoldLogs'
import { useRucoyDashboard } from '@/hooks/useRucoyDashboard'
import { useTrades } from '@/hooks/useTrades'
import type { GoldLog, Trade } from '@/types'
import { toast } from '@/lib/toast'
import { formatDateLong, formatTime, paginateLocally, MONTHS } from '@/utils/format'
import { exportCsv } from '@/utils/csv'
import type { LucideIcon } from 'lucide-react'

type UnifiedEntry =
  | { kind: 'log'; log: GoldLog; date: string }
  | { kind: 'trade'; trade: Trade; date: string }

type TypeFilter = 'all' | 'add' | 'sell' | 'fee' | 'kks' | 'cash'
type MmFeePeriod = 'today' | 'last_month' | 'monthly' | 'yearly' | 'total'

const ENTRY_STYLE: Record<Exclude<TypeFilter, 'all'>, { label: string; Icon: LucideIcon; tile: string; pill: string }> = {
  add:  { label: 'Add',    Icon: TrendingUp,     tile: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400', pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  sell: { label: 'Sell',   Icon: TrendingDown,   tile: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',                 pill: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  fee:  { label: 'MM Fee', Icon: HandCoins,      tile: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',     pill: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  kks:  { label: 'KKS',    Icon: Coins,          tile: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',         pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  cash: { label: 'Cash',   Icon: ArrowLeftRight, tile: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400',             pill: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
}

const fmtG = (n: number) => `${Math.round(n).toLocaleString()} G`
const shortG = (n: number) => {
  const a = Math.abs(n)
  return a >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : a >= 1e6 ? `${(n / 1e6).toFixed(0)}M` : a >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : String(Math.round(n))
}

/** Signed effect of a gold log on the stash (cancelled entries count as 0). */
function logDelta(log: GoldLog): number {
  if (log.cancelled_at) return 0
  const amt = Number(log.amount)
  return log.type === 'add' || log.type === 'fee' ? amt : -Math.abs(amt)
}

export default function RucoySummary() {
  const { totalGold, loading, error, refetch: refetchGolds } = useGolds()
  const { logs, loading: logsLoading, cancel: cancelLog, refetch: refetchLogs } = useGoldLogs()

  // "Correct stash": set the stash to the gold actually on hand
  const [fixOpen, setFixOpen]     = useState(false)
  const [fixActual, setFixActual] = useState('')
  const [fixNote, setFixNote]     = useState('')
  const [fixing, setFixing]       = useState(false)
  const openFix = () => { setFixActual(''); setFixNote(''); setFixOpen(true) }
  const handleFix = async () => {
    const actual = parseFloat(fixActual)
    if (fixActual === '' || isNaN(actual)) return
    setFixing(true)
    try {
      const r = await goldStashApi.adjust(actual, fixNote.trim())
      await Promise.all([refetchGolds(), refetchLogs()])
      toast.success(r.delta === 0 ? 'Stash already matches.' : `Stash corrected by ${r.delta > 0 ? '+' : '−'}${Math.abs(r.delta).toLocaleString()} G — now ${r.stash.toLocaleString()} G.`)
      setFixOpen(false)
    } catch {
      toast.error('Could not correct the stash.')
    } finally {
      setFixing(false)
    }
  }
  const { trades, loading: tradesLoading } = useTrades()
  const { stats } = useRucoyDashboard()
  const accountCost   = Number(stats?.account_total_cost ?? 0)
  const accountsToPay = Number(stats?.accounts_to_pay ?? 0)

  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [page, setPage]             = useState(1)

  const [mmFeePeriod, setMmFeePeriod]   = useState<MmFeePeriod>('monthly')
  const [mmFeeDropOpen, setMmFeeDropOpen] = useState(false)
  const mmFeeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mmFeeRef.current && !mmFeeRef.current.contains(e.target as Node)) setMmFeeDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const mmFeePeriodTotal = useMemo(() => {
    const now = new Date()
    return logs
      .filter((l) => l.type === 'fee' && !l.cancelled_at)
      .filter((l) => {
        const d = new Date(l.created_at)
        if (mmFeePeriod === 'today') return d.toDateString() === now.toDateString()
        if (mmFeePeriod === 'last_month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear()
        }
        if (mmFeePeriod === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        if (mmFeePeriod === 'yearly') return d.getFullYear() === now.getFullYear()
        return true
      })
      .reduce((sum, l) => sum + parseFloat(l.amount), 0)
  }, [logs, mmFeePeriod])

  const mmFeePeriodLabel: Record<MmFeePeriod, string> = {
    today: 'Today', last_month: 'Last month', monthly: 'This month', yearly: 'This year', total: 'All time',
  }

  // ── This month's flow + last 30 days ──
  const flow = useMemo(() => {
    const now = new Date()
    let added = 0, sold = 0, fees = 0
    for (const l of logs) {
      if (l.cancelled_at) continue
      const d = new Date(l.created_at)
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue
      const amt = Number(l.amount)
      if (l.type === 'add') added += amt
      else if (l.type === 'fee') fees += amt
      else sold += Math.abs(amt)
    }
    // Daily in/out for the last 30 days
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29 + i)
      return { key: d.toDateString(), label: d, inflow: 0, outflow: 0 }
    })
    const byKey = new Map(days.map((d) => [d.key, d]))
    for (const l of logs) {
      const day = byKey.get(new Date(l.created_at).toDateString())
      if (!day) continue
      const delta = logDelta(l)
      if (delta >= 0) day.inflow += delta
      else day.outflow += -delta
    }
    return { added, sold, fees, net: added + fees - sold, days }
  }, [logs])
  const dayMax = Math.max(1, ...flow.days.map((d) => Math.max(d.inflow, d.outflow)))

  // ── History ──
  const allEntries = useMemo((): UnifiedEntry[] => {
    const logEntries: UnifiedEntry[] = logs.map((l) => ({ kind: 'log', log: l, date: l.created_at }))
    const tradeEntries: UnifiedEntry[] = trades.map((t) => ({ kind: 'trade', trade: t, date: t.created_at }))
    return [...logEntries, ...tradeEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [logs, trades])

  const typeOfEntry = (e: UnifiedEntry): Exclude<TypeFilter, 'all'> =>
    e.kind === 'trade' ? (e.trade.status === 'kks' ? 'kks' : 'cash') : (e.log.type === 'add' ? 'add' : e.log.type === 'fee' ? 'fee' : 'sell')

  const typeCounts = useMemo(() => {
    const c: Record<TypeFilter, number> = { all: allEntries.length, add: 0, sell: 0, fee: 0, kks: 0, cash: 0 }
    for (const e of allEntries) c[typeOfEntry(e)]++
    return c
  }, [allEntries]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allEntries.filter((e) => {
      const desc = e.kind === 'log' ? (e.log.description ?? '') : (e.trade.description ?? '')
      if (q && !desc.toLowerCase().includes(q)) return false
      return typeFilter === 'all' || typeOfEntry(e) === typeFilter
    })
  }, [allEntries, typeFilter, search]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Total Gold = stash (live) + gold sitting in active KKS trades
  const tradesGold  = Number(stats?.kks_gold ?? 0)
  const tradeCount  = stats?.trade_count ?? 0
  const overallGold = totalGold + tradesGold
  const negative    = !loading && overallGold < 0

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
          <button onClick={openFix} title="Set the stash to the gold you actually have"
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />
          <div className={['absolute -top-16 left-1/3 h-48 w-48 rounded-full blur-3xl', negative ? 'bg-red-500/10' : 'bg-amber-400/10'].join(' ')} />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={['flex h-6 w-6 items-center justify-center rounded-lg', negative ? 'bg-red-400/20' : 'bg-amber-400/20'].join(' ')}>
                    <Coins className={['h-3.5 w-3.5', negative ? 'text-red-300' : 'text-amber-400'].join(' ')} />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Gold</span>
                </div>
                <p className={['text-4xl font-bold', negative ? 'text-red-300' : 'text-amber-300'].join(' ')}>
                  {overallGold.toLocaleString()} <span className="text-xl font-semibold opacity-60">G</span>
                </p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <ArrowLeftRight className="h-3 w-3" />
                  Stash + gold in {tradeCount} active trade{tradeCount !== 1 ? 's' : ''} · {logs.length} log{logs.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                {negative && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/15 px-3 py-1 text-[11px] font-semibold text-red-200"
                    title="More gold has been sold or deducted than added. Add the gold you received, or cancel entries that shouldn't count.">
                    <AlertCircle size={12} /> More sold than added
                  </span>
                )}
                {accountsToPay > 0 && (
                  <Link to="/business/transactions" className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/25 transition-colors">
                    <Users size={12} /> {fmtG(accountsToPay)} to pay on unpaid accounts
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><Coins size={11} /> Gold stash</p>
                <p className={['text-base font-bold', totalGold < 0 ? 'text-red-300' : 'text-slate-100'].join(' ')}>{fmtG(totalGold)}</p>
                <p className="text-[10px] text-slate-500">In your inventory</p>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><TrendingUp size={11} /> Trades gold</p>
                <p className="text-base font-bold text-amber-200">{fmtG(tradesGold)}</p>
                <p className="text-[10px] text-slate-500">Held in KKS trades</p>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><Users size={11} /> Account cost</p>
                <p className="text-base font-bold text-slate-100">{fmtG(accountCost)}</p>
                <p className="text-[10px] text-slate-500">Listed accounts</p>
              </div>
              <div className="relative rounded-xl bg-violet-500/10 px-4 py-3" ref={mmFeeRef}>
                <button type="button" onClick={() => setMmFeeDropOpen((o) => !o)} className="w-full text-left">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300/80"><HandCoins size={11} /> Middleman fee</p>
                  <p className="text-base font-bold text-violet-200">{fmtG(mmFeePeriodTotal)}</p>
                  <p className="flex items-center gap-0.5 text-[10px] text-violet-300/70">{mmFeePeriodLabel[mmFeePeriod]} <ChevronDown size={10} /></p>
                </button>
                {mmFeeDropOpen && (
                  <div className="absolute top-full right-0 mt-2 z-20 min-w-[150px] rounded-xl border border-white/10 bg-slate-800 shadow-xl shadow-black/40 overflow-hidden">
                    {(['today', 'monthly', 'last_month', 'yearly', 'total'] as MmFeePeriod[]).map((p) => (
                      <button key={p} type="button" onClick={() => { setMmFeePeriod(p); setMmFeeDropOpen(false) }}
                        className={['flex w-full items-center justify-between gap-4 px-3.5 py-2 text-xs transition-colors', p === mmFeePeriod ? 'bg-violet-500/20 text-violet-300 font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'].join(' ')}>
                        <span>{mmFeePeriodLabel[p]}</span>
                        {p === mmFeePeriod && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── This month + last 30 days ──────────────────────────────── */}
      <Card className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Gold flow</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{MONTHS[new Date().getMonth()]} totals · daily movement over the last 30 days</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> In</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" /> Out</span>
          </div>
        </div>
        {logsLoading ? (
          <div className="m-5 h-40 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-5 p-5">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {[
                { label: 'Added',   value: flow.added, cls: 'text-emerald-600 dark:text-emerald-400', sign: '+' },
                { label: 'Sold',    value: flow.sold,  cls: 'text-red-500 dark:text-red-400',         sign: '−' },
                { label: 'MM fees', value: flow.fees,  cls: 'text-violet-600 dark:text-violet-400',   sign: '+' },
                { label: 'Net',     value: flow.net,   cls: flow.net >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400', sign: flow.net >= 0 ? '+' : '−' },
              ].map(({ label, value, cls, sign }) => (
                <div key={label} className="flex items-baseline justify-between gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
                  <span className={['text-sm font-bold', cls].join(' ')}>{sign}{fmtG(Math.abs(value))}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex h-40 items-center gap-px">
                {flow.days.map((d) => (
                  <div key={d.key} className="group relative flex h-full flex-1 flex-col"
                    title={`${d.label.toLocaleDateString('en', { month: 'short', day: 'numeric' })}: +${fmtG(d.inflow)} / −${fmtG(d.outflow)}`}>
                    <div className="flex flex-1 items-end justify-center">
                      <span className="w-full max-w-[12px] rounded-t-sm bg-emerald-500/80 group-hover:bg-emerald-500" style={{ height: `${(d.inflow / dayMax) * 100}%` }} />
                    </div>
                    <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex flex-1 items-start justify-center">
                      <span className="w-full max-w-[12px] rounded-b-sm bg-red-400/80 group-hover:bg-red-400" style={{ height: `${(d.outflow / dayMax) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                <span>{flow.days[0].label.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                <span>max {shortG(dayMax)} G / day</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        )}
      </Card>

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
            {(['all', 'add', 'sell', 'fee', 'kks', 'cash'] as TypeFilter[]).map((t) => {
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
                  {g.items.map((entry) => {
                    const t = typeOfEntry(entry)
                    const style = ENTRY_STYLE[t]
                    const cancelled = entry.kind === 'log' && !!entry.log.cancelled_at
                    const desc = entry.kind === 'log' ? entry.log.description : entry.trade.description
                    let amount: React.ReactNode
                    if (entry.kind === 'trade') {
                      amount = entry.trade.status === 'kks'
                        ? <span className="text-amber-600 dark:text-amber-400">+{fmtG(Number(entry.trade.amount))}</span>
                        : <span className="text-gray-400 dark:text-gray-500">Cash trade</span>
                    } else {
                      const d = logDelta(entry.log)
                      amount = cancelled
                        ? <span className="text-gray-400 line-through">{fmtG(Math.abs(Number(entry.log.amount)))}</span>
                        : <span className={d >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>{d >= 0 ? '+' : '−'}{fmtG(Math.abs(d))}</span>
                    }
                    return (
                      <div key={`${entry.kind}-${entry.kind === 'log' ? entry.log.id : entry.trade.id}`}
                        className={['group flex items-center gap-3 px-5 py-3 transition-colors', cancelled ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'].join(' ')}>
                        <span className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', cancelled ? 'bg-gray-100 text-gray-400 dark:bg-gray-800' : style.tile].join(' ')}>
                          <style.Icon size={15} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={['text-sm font-medium text-gray-800 dark:text-gray-100 truncate', cancelled ? 'line-through' : ''].join(' ')}>
                            {desc || <span className="text-gray-400 dark:text-gray-500">{style.label}</span>}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                            <span className={['rounded-full px-1.5 py-0.5 text-[10px] font-semibold', style.pill].join(' ')}>{style.label}</span>
                            {formatTime(entry.date)}
                            {cancelled && <span className="font-semibold text-gray-500">· Cancelled</span>}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold whitespace-nowrap">{amount}</span>
                        {entry.kind === 'log' && !cancelled ? (
                          <button onClick={() => setCancelTarget(entry.log.id)} title="Cancel entry"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all">
                            <X size={14} />
                          </button>
                        ) : <span className="w-7 shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700/40">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      {/* Correct stash */}
      <Modal open={fixOpen} onClose={() => setFixOpen(false)} title="Correct stash" size="md">
        {(() => {
          const actual = parseFloat(fixActual)
          const valid  = fixActual !== '' && !isNaN(actual)
          const delta  = valid ? actual - totalGold : 0
          return (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Enter the gold you <b>actually have</b> in game. One correction entry is recorded for the difference, so the stash matches from now on.
              </p>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Stash right now</span>
                <span className={['text-sm font-bold', totalGold < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'].join(' ')}>{totalGold.toLocaleString()} G</span>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Actual gold on hand</p>
                <div className="flex items-center gap-2 rounded-xl border-2 border-amber-200 dark:border-amber-900/60 px-4 py-3 focus-within:border-amber-400">
                  <Coins className="h-5 w-5 shrink-0 text-amber-500" />
                  <input
                    autoFocus
                    inputMode="decimal"
                    value={fixActual ? Number(fixActual).toLocaleString('en', { maximumFractionDigits: 0 }) : ''}
                    onChange={(e) => {
                      const s = e.target.value.replace(/,/g, '')
                      if (s === '' || /^\d*$/.test(s)) setFixActual(s)
                    }}
                    placeholder="e.g. 99,000,000"
                    className="w-full bg-transparent text-2xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-600"
                  />
                  <span className="text-lg font-semibold text-amber-500">G</span>
                </div>
              </div>
              <Input label="Note (optional)" value={fixNote} onChange={(e) => setFixNote(e.target.value)} placeholder="Stash correction" />
              {valid && (
                <div className={['rounded-xl px-4 py-3 text-sm', delta === 0 ? 'bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400' : delta > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'].join(' ')}>
                  {delta === 0
                    ? 'Already matches — nothing to record.'
                    : <>Records <b>{delta > 0 ? '+' : '−'}{Math.abs(delta).toLocaleString()} G</b> so the stash becomes <b>{actual.toLocaleString()} G</b>.</>}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setFixOpen(false)} disabled={fixing}>Cancel</Button>
                <Button onClick={handleFix} loading={fixing} disabled={!valid || delta === 0}>Correct stash</Button>
              </div>
            </div>
          )
        })()}
      </Modal>

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
