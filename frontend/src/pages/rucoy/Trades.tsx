import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, ArrowLeftRight, ArrowUp, ArrowDown, ArrowUpDown, Banknote, CalendarClock, ChevronLeft, ChevronRight, Coins, HandCoins, Search, Check, Archive, RotateCcw, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TradeModal } from '@/components/modals/TradeModal'
import { useTrades } from '@/hooks/useTrades'
import { tradesApi } from '@/api/rucoy'
import { toast } from '@/components/ui/Toast'
import { formatCurrency, formatDateLong, formatTime } from '@/utils/format'
import { exportCsv } from '@/utils/csv'
import { CURRENCY_SYMBOLS } from '@/utils/rucoy'
import type { TradePayload } from '@/api/rucoy'
import type { Trade, TradeStatus } from '@/types'

const PER_PAGE = 10

function formatAmount(t: Trade) {
  if (t.status === 'kks') return `${Number(t.amount).toLocaleString()} G`
  const symbol = t.currency ? CURRENCY_SYMBOLS[t.currency] : '₱'
  if (symbol === '₱') return formatCurrency(parseFloat(t.amount))
  return `${symbol}${Number(t.amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatusPill({ status }: { status: TradeStatus }) {
  return status === 'cash' ? (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      CASH
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      KKS
    </span>
  )
}

/** Countdown pill for a trade's completion date. */
function dueLabel(date: string | null): { text: string; cls: string } {
  if (!date) return { text: 'No date', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((new Date(date.slice(0, 10) + 'T00:00:00').getTime() - today.getTime()) / 86400000)
  if (diff < 0)   return { text: `${-diff}d overdue`, cls: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' }
  if (diff === 0) return { text: 'Due today', cls: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' }
  if (diff <= 7)  return { text: `in ${diff}d`, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
  return { text: `in ${diff}d`, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
}

export default function Trades() {
  const { trades, loading, error, create, update, archive, unarchive, remove } = useTrades()

  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'kks' | 'cash'>('all')
  const [dateSort, setDateSort]     = useState<'asc' | 'desc' | null>(null)
  const [page, setPage]             = useState(1)
  const [modalOpen, setModalOpen]   = useState(false)
  const [editing, setEditing]       = useState<Trade | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Trade | null>(null)
  const [deleting, setDeleting]     = useState(false)

  const [showArchive, setShowArchive]       = useState(false)
  const [archivedTrades, setArchivedTrades] = useState<Trade[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [archiveTarget, setArchiveTarget]   = useState<Trade | null>(null)
  const [archiving, setArchiving]           = useState(false)
  const [unarchiveTarget, setUnarchiveTarget] = useState<Trade | null>(null)
  const [unarchiving, setUnarchiving]       = useState(false)

  const fetchArchived = useCallback(async () => {
    setArchiveLoading(true)
    try { setArchivedTrades(await tradesApi.getArchived()) }
    finally { setArchiveLoading(false) }
  }, [])

  useEffect(() => { if (showArchive) fetchArchived() }, [showArchive, fetchArchived])

  const handleArchive = async () => {
    if (!archiveTarget) return
    const target = archiveTarget
    setArchiving(true)
    setArchiveTarget(null)
    try {
      await archive(target.id)
      if (showArchive) fetchArchived()
      toast.success('Trade archived.', {
        action: { label: 'Undo', onClick: () => setUnarchiveTarget(target) },
      })
    } catch {
      toast.error('Failed to archive trade.')
    } finally {
      setArchiving(false)
    }
  }

  const handleUnarchive = async () => {
    if (!unarchiveTarget) return
    setUnarchiving(true)
    try {
      await unarchive(unarchiveTarget.id)
      setArchivedTrades((prev) => prev.filter((t) => t.id !== unarchiveTarget.id))
      toast.success('Trade restored.')
    } catch {
      toast.error('Failed to restore trade.')
    } finally {
      setUnarchiving(false)
      setUnarchiveTarget(null)
    }
  }

  const totalKksGold = useMemo(() =>
    trades.filter((t) => t.status === 'kks').reduce((sum, t) => sum + Number(t.amount), 0),
  [trades])

  const cashCount = useMemo(() => trades.filter((t) => t.status === 'cash').length, [trades])
  const kksCount  = useMemo(() => trades.filter((t) => t.status === 'kks').length,  [trades])

  const filteredTrades = useMemo(() => {
    let result = typeFilter === 'all' ? trades : trades.filter((t) => t.status === typeFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((t) =>
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.payment_method ?? '').toLowerCase().includes(q)
      )
    }
    return result
  }, [trades, typeFilter, search])

  const sortedTrades = useMemo(() => {
    if (!dateSort) return filteredTrades
    return [...filteredTrades].sort((a, b) => {
      const da = a.completion_date ?? '', db = b.completion_date ?? ''
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      return dateSort === 'asc' ? da.localeCompare(db) : db.localeCompare(da)
    })
  }, [filteredTrades, dateSort])

  const totalPages     = Math.max(1, Math.ceil(sortedTrades.length / PER_PAGE))
  const paginatedTrades = useMemo(() => sortedTrades.slice((page - 1) * PER_PAGE, page * PER_PAGE), [sortedTrades, page])

  const cycleSort     = () => { setPage(1); setDateSort((s) => s === null ? 'asc' : s === 'asc' ? 'desc' : null) }
  const changeFilter  = (f: typeof typeFilter) => { setTypeFilter(f); setPage(1) }
  const changeSearch  = (q: string) => { setSearch(q); setPage(1) }
  const openCreate    = () => { setEditing(null); setModalOpen(true) }
  const openEdit      = (t: Trade) => { setEditing(t); setModalOpen(true) }

  const handleExport = () => exportCsv('trades', trades.map((t) => ({
    date: t.created_at, status: t.status, amount: t.amount, currency: t.currency ?? '', description: t.description ?? '',
  })))

  const handleSubmit = async (data: TradePayload) => {
    if (editing) {
      await update(editing.id, data)
      toast.success('Trade updated.')
    } else {
      await create(data)
      toast.success('Trade added.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Trade deleted.')
      if (paginatedTrades.length === 1 && page > 1) setPage((p) => p - 1)
    } catch (err: unknown) {
      toast.error((err as { message: string }).message)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const from = sortedTrades.length === 0 ? 0 : (page - 1) * PER_PAGE + 1
  const to   = Math.min(page * PER_PAGE, sortedTrades.length)

  return (
    <div className="flex flex-col gap-5">

      {error && <div className="text-red-500 text-sm text-center py-2">{error}</div>}

      {/* Hero card */}
      {loading ? (
        <div className="h-36 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

          <div className="relative flex flex-col gap-4">
            {/* Primary: gold held in KKS trades */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400/20">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">KKS Gold</span>
              </div>
              <p className="text-3xl font-bold text-amber-400">
                {totalKksGold.toLocaleString()} <span className="text-xl font-semibold opacity-60">G</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <ArrowLeftRight className="h-3 w-3" />
                Across {kksCount} active KKS trade{kksCount !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Sub-stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-slate-300" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Trades</p>
                  <p className="text-sm font-bold text-slate-200">{trades.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20">
                  <Coins className="h-3.5 w-3.5 text-amber-300" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">KKS</p>
                  <p className="text-sm font-bold text-amber-300">{kksCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/20">
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cash</p>
                  <p className="text-sm font-bold text-emerald-300">{cashCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                  <Coins className="h-3.5 w-3.5 text-slate-300" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Avg per KKS</p>
                  <p className="text-sm font-bold text-slate-200">
                    {kksCount > 0 ? `${Math.round(totalKksGold / kksCount).toLocaleString()} G` : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* KKS vs Cash split */}
            {trades.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-amber-400" style={{ width: `${(kksCount / trades.length) * 100}%` }} />
                  <div className="h-full bg-emerald-400" style={{ width: `${(cashCount / trades.length) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-semibold">
                  <span className="text-amber-300">KKS {Math.round((kksCount / trades.length) * 100)}%</span>
                  <span className="text-emerald-300">Cash {Math.round((cashCount / trades.length) * 100)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs + toolbar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          {([
            { key: false, label: 'Active',  Icon: ArrowLeftRight, count: trades.length },
            { key: true,  label: 'Archive', Icon: Archive,        count: showArchive ? archivedTrades.length : null },
          ] as const).map(({ key, label, Icon, count }) => (
            <button
              key={label}
              onClick={() => setShowArchive(key)}
              className={[
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all',
                showArchive === key ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              ].join(' ')}
            >
              <Icon size={14} />
              {label}
              {count != null && <span className="rounded-full bg-gray-200/70 dark:bg-gray-700 px-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-300">{count}</span>}
            </button>
          ))}
        </div>

        {!showArchive && (
          <>
            <div className="relative min-w-0 flex-1 max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => changeSearch(e.target.value)}
                placeholder="Search trades…"
                className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1">
              {(['all', 'kks', 'cash'] as const).map((f) => (
                <button key={f} onClick={() => changeFilter(f)}
                  className={['rounded-md px-3 py-1 text-xs font-semibold transition-colors', typeFilter === f ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'].join(' ')}>
                  {f === 'all' ? 'All' : f.toUpperCase()}
                  <span className="ml-1 opacity-60">{f === 'all' ? trades.length : f === 'kks' ? kksCount : cashCount}</span>
                </button>
              ))}
            </div>

            <button onClick={cycleSort} title="Sort by completion date"
              className={['hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors', dateSort ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'].join(' ')}>
              {dateSort === 'asc' ? <ArrowUp size={13} /> : dateSort === 'desc' ? <ArrowDown size={13} /> : <ArrowUpDown size={13} />}
              Date
            </button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleExport}>Export</Button>
          </div>
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>New Trade</Button>
        </div>
      </div>

      {/* ── Active trades ───────────────────────────────────────────── */}
      {!showArchive && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />)}
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <ArrowLeftRight className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No active trades</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add a KKS or cash trade to start tracking.</p>
            </div>
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>New Trade</Button>
          </div>
        ) : sortedTrades.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">No trades match your filters.</div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedTrades.map((t) => {
                const isKks = t.status === 'kks'
                const due   = dueLabel(t.completion_date)
                return (
                  <div key={t.id} className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all">
                    <div className={['h-1 w-full', isKks ? 'bg-amber-400' : 'bg-emerald-500'].join(' ')} />
                    <div className="flex items-start gap-3 px-4 pt-3.5">
                      <span className={['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', isKks ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'].join(' ')}>
                        {isKks ? <Coins size={18} /> : <Banknote size={18} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{t.description || (isKks ? 'KKS trade' : 'Cash trade')}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">Added {formatDateLong(t.created_at)} · {formatTime(t.created_at)}</p>
                      </div>
                      <StatusPill status={t.status} />
                    </div>

                    <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
                      <p className={['text-2xl font-bold', isKks ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'].join(' ')}>
                        {formatAmount(t)}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {t.payment_method && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-semibold capitalize text-gray-600 dark:text-gray-300">{t.payment_method}</span>
                        )}
                        {isKks && t.middleman_fee != null && Number(t.middleman_fee) > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                            <HandCoins size={10} /> MM fee {Number(t.middleman_fee).toLocaleString()} G
                          </span>
                        )}
                        <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', due.cls].join(' ')}>
                          <CalendarClock size={10} /> {due.text}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/30 px-4 py-2.5">
                      <span className="flex-1 truncate text-[11px] text-gray-400 dark:text-gray-500">
                        {t.completion_date ? `Completes ${formatDateLong(t.completion_date)}` : 'No completion date'}
                      </span>
                      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setArchiveTarget(t)} disabled={archiving} title="Mark as done"
                          className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-40 transition-colors">
                          <Check size={12} /> Done
                        </button>
                        <button onClick={() => openEdit(t)} title="Edit"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(t)} title="Delete"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              <button onClick={openCreate}
                className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-indigo-300 hover:text-indigo-500 dark:hover:border-indigo-700 dark:hover:text-indigo-400 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"><Plus size={18} /></div>
                <span className="text-sm font-semibold">New trade</span>
              </button>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-gray-500">{from}–{to} of {sortedTrades.length} trades</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      className={['flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors', p === page ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'].join(' ')}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ── Archive ─────────────────────────────────────────────────── */}
      {showArchive && (
        <Card className="flex flex-col">
          {archiveLoading ? (
            <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                  <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800" />
                  <div className="flex-1 h-3 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          ) : archivedTrades.length === 0 ? (
            <p className="py-14 text-center text-sm text-gray-400 dark:text-gray-500">No archived trades.</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
              {archivedTrades.map((t) => {
                const isKks = t.status === 'kks'
                return (
                  <div key={t.id} className="group flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <span className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl opacity-70', isKks ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'].join(' ')}>
                      {isKks ? <Coins size={15} /> : <Banknote size={15} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{t.description || (isKks ? 'KKS trade' : 'Cash trade')}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                        <StatusPill status={t.status} />
                        {t.payment_method && <span className="capitalize">{t.payment_method}</span>}
                        <span>· done {formatDateLong(t.archived_at ?? t.completion_date)}</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatAmount(t)}</span>
                    <button onClick={() => setUnarchiveTarget(t)} title="Restore"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      <RotateCcw size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      <TradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        trade={editing}
      />

      <ConfirmDialog open={!!archiveTarget} onClose={() => setArchiveTarget(null)} onConfirm={handleArchive} loading={archiving}
        title="Archive Trade" message={`Archive trade #${archiveTarget?.id}? You can restore it anytime.`} confirmLabel="Archive" />

      <ConfirmDialog open={!!unarchiveTarget} onClose={() => setUnarchiveTarget(null)} onConfirm={handleUnarchive} loading={unarchiving}
        title="Restore Trade" message={`Restore trade #${unarchiveTarget?.id} back to active trades?`} confirmLabel="Restore" />

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}
        title="Delete Trade" message={`Delete trade #${deleteTarget?.id}? This cannot be undone.`} confirmLabel="Delete" />
    </div>
  )
}
