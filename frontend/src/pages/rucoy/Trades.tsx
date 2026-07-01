import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, ArrowLeftRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TradeModal } from '@/components/modals/TradeModal'
import { useTrades } from '@/hooks/useTrades'
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
  const { trades, loading, error, create, update, remove } = useTrades()

  const [typeFilter, setTypeFilter] = useState<'all' | 'kks' | 'cash'>('all')
  const [dateSort, setDateSort] = useState<'asc' | 'desc' | null>(null)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Trade | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Trade | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filteredTrades = useMemo(() =>
    typeFilter === 'all' ? trades : trades.filter((t) => t.status === typeFilter),
  [trades, typeFilter])

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
  }, [trades, dateSort])

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
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1" /> New Trade
        </Button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        {(['all', 'kks', 'cash'] as const).map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className={[
              'rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase transition-colors',
              typeFilter === f
                ? f === 'kks'
                  ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700'
                  : f === 'cash'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700'
                  : 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-700'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            {f === 'all' ? 'All' : f.toUpperCase()}
          </button>
        ))}
      </div>

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
