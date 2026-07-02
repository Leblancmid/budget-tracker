import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, ArrowLeftRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Coins, Search, Check, Archive } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TradeModal } from '@/components/modals/TradeModal'
import { useTrades } from '@/hooks/useTrades'
import { tradesApi } from '@/api/rucoy'
import { toast } from '@/components/ui/Toast'
import { formatCurrency } from '@/utils/format'
import type { TradePayload } from '@/api/rucoy'
import type { Trade, TradeCurrency, TradeStatus } from '@/types'

const PER_PAGE = 10

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

const CURRENCY_SYMBOLS: Record<TradeCurrency, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
}

function formatAmount(t: Trade) {
  if (t.status === 'kks') return `${Number(t.amount).toLocaleString()} G`
  const symbol = t.currency ? CURRENCY_SYMBOLS[t.currency] : '₱'
  if (symbol === '₱') return formatCurrency(parseFloat(t.amount))
  return `${symbol}${Number(t.amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatusPill({ status }: { status: TradeStatus }) {
  return status === 'cash' ? (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      CASH
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      KKS
    </span>
  )
}

export default function Trades() {
  const { trades, loading, error, create, update, archive, remove } = useTrades()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'kks' | 'cash'>('all')
  const [dateSort, setDateSort] = useState<'asc' | 'desc' | null>(null)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Trade | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Trade | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [showArchive, setShowArchive] = useState(false)
  const [archivedTrades, setArchivedTrades] = useState<Trade[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [archiving, setArchiving] = useState<number | null>(null)

  const fetchArchived = useCallback(async () => {
    setArchiveLoading(true)
    try { setArchivedTrades(await tradesApi.getArchived()) }
    finally { setArchiveLoading(false) }
  }, [])

  useEffect(() => { if (showArchive) fetchArchived() }, [showArchive, fetchArchived])

  const handleArchive = async (t: Trade) => {
    setArchiving(t.id)
    try {
      await archive(t.id)
      toast.success('Trade archived.')
      if (showArchive) fetchArchived()
    } catch {
      toast.error('Failed to archive trade.')
    } finally {
      setArchiving(null)
    }
  }

  const totalKksGold = useMemo(() =>
    trades.filter((t) => t.status === 'kks').reduce((sum, t) => sum + Number(t.amount), 0),
  [trades])

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
      const da = a.completion_date ?? ''
      const db = b.completion_date ?? ''
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      return dateSort === 'asc' ? da.localeCompare(db) : db.localeCompare(da)
    })
  }, [filteredTrades, dateSort])

  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / PER_PAGE))

  const paginatedTrades = useMemo(() => {
    const start = (page - 1) * PER_PAGE
    return sortedTrades.slice(start, start + PER_PAGE)
  }, [sortedTrades, page])

  const cycleSort = () => {
    setPage(1)
    setDateSort((s) => (s === null ? 'asc' : s === 'asc' ? 'desc' : null))
  }

  const changeFilter = (f: typeof typeFilter) => { setTypeFilter(f); setPage(1) }
  const changeSearch = (q: string) => { setSearch(q); setPage(1) }

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (t: Trade) => { setEditing(t); setModalOpen(true) }

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Trades</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {trades.length} trade{trades.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Search…"
              className="rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-1.5 text-sm text-gray-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 w-44"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => changeFilter(e.target.value as typeof typeFilter)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="all">All Types</option>
            <option value="kks">KKS</option>
            <option value="cash">CASH</option>
          </select>
          <button
            onClick={() => setShowArchive((v) => !v)}
            className={[
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              showArchive
                ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            <Archive size={14} />
            Archive
          </button>
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-1" /> New Trade
          </Button>
        </div>
      </div>

      {!loading && (
        <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/40 dark:bg-amber-900/10">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 dark:bg-amber-500/20">
            <Coins size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-500 uppercase tracking-wide">Total Trade Gold</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {totalKksGold.toLocaleString()} <span className="text-base font-semibold">G</span>
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-0.5">From KKS trades only</p>
          </div>
        </div>
      )}

      {loading && <div className="text-center text-gray-400 py-10">Loading…</div>}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      {!loading && trades.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <ArrowLeftRight size={40} className="text-indigo-400" />
          <p className="text-gray-500 dark:text-gray-400">No trades yet. Start one!</p>
        </Card>
      )}

      {!loading && trades.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <button onClick={cycleSort} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                      Done
                      {dateSort === 'asc'  && <ChevronUp size={13} />}
                      {dateSort === 'desc' && <ChevronDown size={13} />}
                      {dateSort === null   && <span className="opacity-30"><ChevronUp size={13} /></span>}
                    </button>
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {paginatedTrades.map((t, i) => {
                  const rowNum = (page - 1) * PER_PAGE + i + 1
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-400 dark:text-gray-500">{rowNum}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                        {t.description || <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center"><StatusPill status={t.status} /></td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">
                        {t.payment_method || <span className="italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                        {formatAmount(t)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(t.completion_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleArchive(t)}
                            disabled={archiving === t.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-40 transition-colors"
                            title="Mark as done"
                          >
                            <Check size={15} />
                          </button>
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium text-gray-700 dark:text-gray-300">{from}–{to}</span> of{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{sortedTrades.length}</span> trades
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={[
                      'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                      p === page
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                    ].join(' ')}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showArchive && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Archive size={15} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Archived Trades</h2>
          </div>
          {archiveLoading && <p className="text-center text-sm text-gray-400 py-6">Loading…</p>}
          {!archiveLoading && archivedTrades.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">No archived trades yet.</p>
          )}
          {!archiveLoading && archivedTrades.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 opacity-80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Done</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {archivedTrades.map((t, i) => (
                    <tr key={t.id} className="text-gray-400 dark:text-gray-500">
                      <td className="px-4 py-3 font-mono">{i + 1}</td>
                      <td className="px-4 py-3 max-w-[180px] truncate">
                        {t.description || <span className="italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center"><StatusPill status={t.status} /></td>
                      <td className="px-4 py-3 capitalize">{t.payment_method || <span className="italic">—</span>}</td>
                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{formatAmount(t)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.completion_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <TradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        trade={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Trade"
        message={`Delete trade #${deleteTarget?.id}? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
