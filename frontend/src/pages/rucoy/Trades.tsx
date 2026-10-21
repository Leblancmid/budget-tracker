import { useMemo, useState } from 'react'
import { Plus, ArrowLeftRight, ArrowUp, ArrowDown, ArrowUpDown, Search, Archive, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TradeModal } from '@/components/modals/TradeModal'
import { useTrades } from '@/hooks/useTrades'
import { useArchive } from '@/hooks/useArchive'
import { tradesApi, type TradePayload } from '@/api/rucoy'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'
import { exportCsv } from '@/utils/csv'
import type { Trade } from '@/types'
import { ArchivedTradeRow } from './trades/ArchivedTradeRow'
import { TradeCard } from './trades/TradeCard'
import { TradesHero } from './trades/TradesHero'
import { TradesPager } from './trades/TradesPager'
import { PER_PAGE, sortByCompletion } from './trades/tradeFormat'

/** Rucoy → Trades: active KKS / cash trades and the archive. */
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

  const { showArchive, setShowArchive, archivedItems: archivedTrades, archiveLoading, fetchArchived, removeFromArchived } = useArchive(tradesApi.getArchived)
  const [archiveTarget, setArchiveTarget]     = useState<Trade | null>(null)
  const [archiving, setArchiving]             = useState(false)
  const [unarchiveTarget, setUnarchiveTarget] = useState<Trade | null>(null)
  const [unarchiving, setUnarchiving]         = useState(false)

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
      removeFromArchived((t) => t.id !== unarchiveTarget.id)
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

  const sortedTrades = useMemo(() => (dateSort ? sortByCompletion(filteredTrades, dateSort) : filteredTrades), [filteredTrades, dateSort])

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
      toast.error(errorMessage(err))
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
        <TradesHero totalKksGold={totalKksGold} tradeCount={trades.length} kksCount={kksCount} cashCount={cashCount} />
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
              {paginatedTrades.map((t) => (
                <TradeCard
                  key={t.id}
                  trade={t}
                  archiving={archiving}
                  onDone={() => setArchiveTarget(t)}
                  onEdit={() => openEdit(t)}
                  onDelete={() => setDeleteTarget(t)}
                />
              ))}

              <button onClick={openCreate}
                className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-indigo-300 hover:text-indigo-500 dark:hover:border-indigo-700 dark:hover:text-indigo-400 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"><Plus size={18} /></div>
                <span className="text-sm font-semibold">New trade</span>
              </button>
            </div>

            {totalPages > 1 && (
              <TradesPager page={page} totalPages={totalPages} from={from} to={to} total={sortedTrades.length} onPageChange={setPage} />
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
              {archivedTrades.map((t) => (
                <ArchivedTradeRow key={t.id} trade={t} onRestore={() => setUnarchiveTarget(t)} />
              ))}
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
