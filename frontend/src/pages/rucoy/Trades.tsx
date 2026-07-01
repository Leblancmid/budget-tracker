import { useState } from 'react'
import { Plus, Pencil, Trash2, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TradeModal } from '@/components/modals/TradeModal'
import { useTrades } from '@/hooks/useTrades'
import { toast } from '@/components/ui/Toast'
import { formatCurrency } from '@/utils/format'
import type { TradePayload } from '@/api/rucoy'
import type { Trade, TradeCurrency, TradeStatus } from '@/types'

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

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Trade | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Trade | null>(null)
  const [deleting, setDeleting] = useState(false)

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
    } catch (err: unknown) {
      toast.error((err as { message: string }).message)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Trades</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {trades.length} active trade{trades.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1" /> New Trade
        </Button>
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
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Done</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {trades.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400">#{t.id}</td>
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
                    {t.completion_date ?? <span className="italic">—</span>}
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
              ))}
            </tbody>
          </table>
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
