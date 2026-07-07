import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, ArrowLeftRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Coins, Search, Check, Archive, RotateCcw, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TradeModal } from '@/components/modals/TradeModal'
import { useTrades } from '@/hooks/useTrades'
import { tradesApi } from '@/api/rucoy'
import { toast } from '@/components/ui/Toast'
import { formatCurrency, formatDateLong } from '@/utils/format'
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="relative max-w-xs">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Search trades…"
              className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1">
          {(['all', 'kks', 'cash'] as const).map((f) => (
            <button
              key={f}
              onClick={() => changeFilter(f)}
              className={[
                'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                typeFilter === f
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              ].join(' ')}
            >
              {f === 'all' ? 'All' : f.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowArchive((v) => !v)}
          className={[
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
            showArchive
              ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
              : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
          ].join(' ')}
        >
          <Archive size={13} />
          Archive
          {archivedTrades.length > 0 && showArchive && (
            <span className="ml-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-[10px] font-bold px-1.5">
              {archivedTrades.length}
            </span>
          )}
        </button>

        <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleExport}>Export</Button>
        <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>New Trade</Button>
      </div>

      {/* Stats strip */}
      {!loading && trades.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
              <ArrowLeftRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Total</p>
              <p className="text-base font-bold text-gray-800 dark:text-gray-100">{trades.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-900/10 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-amber-600 dark:text-amber-500 uppercase tracking-wide">KKS Gold</p>
              <p className="text-base font-bold text-amber-700 dark:text-amber-300">{totalKksGold.toLocaleString()} G</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/60 dark:bg-emerald-900/10 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-wide">CASH / KKS</p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{cashCount} / {kksCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main table */}
      <Card className="flex flex-col">
        {loading ? (
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="h-3 w-6 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 h-3 w-40 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-5 w-12 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800 ml-auto" />
              </div>
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <ArrowLeftRight className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No trades yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add your first trade to get started.</p>
            </div>
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>New Trade</Button>
          </div>
        ) : sortedTrades.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">No trades match your filters.</div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/60">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-10">#</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Description</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Payment</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold dark:text-gray-400">
                      <button
                        onClick={cycleSort}
                        className="flex items-center gap-1 text-gray-500 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-xs font-semibold"
                      >
                        Done
                        {dateSort === 'asc'  && <ChevronUp size={12} />}
                        {dateSort === 'desc' && <ChevronDown size={12} />}
                        {dateSort === null   && <ChevronUp size={12} className="opacity-25" />}
                      </button>
                    </th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {paginatedTrades.map((t, i) => (
                    <tr key={t.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {(page - 1) * PER_PAGE + i + 1}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                        {t.description || <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusPill status={t.status} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 capitalize text-xs">
                        {t.payment_method || <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                        {formatAmount(t)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {formatDateLong(t.completion_date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setArchiveTarget(t)}
                            disabled={archiving}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-40 transition-colors"
                            title="Mark as done"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(t)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(t)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 dark:border-gray-700/40">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {from}–{to} of {sortedTrades.length} trades
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={[
                        'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                        p === page
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Archive section */}
      {showArchive && (
        <Card className="flex flex-col">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 bg-amber-50/40 dark:bg-amber-900/10">
            <Archive size={13} className="text-amber-500 dark:text-amber-400" />
            <h2 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Archived Trades</h2>
            {archivedTrades.length > 0 && (
              <span className="ml-auto text-[11px] font-semibold text-amber-600 dark:text-amber-500">
                {archivedTrades.length} total
              </span>
            )}
          </div>

          {archiveLoading ? (
            <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                  <div className="flex-1 h-3 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-5 w-12 rounded-full bg-gray-100 dark:bg-gray-800" />
                  <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          ) : archivedTrades.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">No archived trades.</p>
          ) : (
            <div className="overflow-x-auto scrollbar-thin opacity-80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/60">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-10">#</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Description</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Payment</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Done</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {archivedTrades.map((t, i) => (
                    <tr key={t.id} className="text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs">{i + 1}</td>
                      <td className="px-5 py-3 max-w-[200px] truncate">
                        {t.description || <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3 text-center"><StatusPill status={t.status} /></td>
                      <td className="px-5 py-3 capitalize text-xs">{t.payment_method || '—'}</td>
                      <td className="px-5 py-3 text-right font-semibold whitespace-nowrap">{formatAmount(t)}</td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap">{formatDateLong(t.completion_date)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setUnarchiveTarget(t)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          title="Restore"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <TradeModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} trade={editing} />

      <ConfirmDialog open={!!archiveTarget} onClose={() => setArchiveTarget(null)} onConfirm={handleArchive} loading={archiving}
        title="Archive Trade" message={`Archive trade #${archiveTarget?.id}? You can restore it anytime.`} confirmLabel="Archive" />

      <ConfirmDialog open={!!unarchiveTarget} onClose={() => setUnarchiveTarget(null)} onConfirm={handleUnarchive} loading={unarchiving}
        title="Restore Trade" message={`Restore trade #${unarchiveTarget?.id} back to active trades?`} confirmLabel="Restore" />

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}
        title="Delete Trade" message={`Delete trade #${deleteTarget?.id}? This cannot be undone.`} confirmLabel="Delete" />
    </div>
  )
}
