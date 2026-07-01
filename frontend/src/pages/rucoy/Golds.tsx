import { useState } from 'react'
import { Plus, Minus, Pencil, Trash2, Coins, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { GoldModal } from '@/components/modals/GoldModal'
import { useGolds } from '@/hooks/useGolds'
import { useGoldLogs } from '@/hooks/useGoldLogs'
import { goldsApi } from '@/api/rucoy'
import { toast } from '@/components/ui/Toast'
import type { Gold } from '@/types'

function formatWithCommas(raw: string): string {
  if (!raw) return ''
  const [integer, decimal] = raw.split('.')
  return decimal !== undefined
    ? `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimal}`
    : integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function Golds() {
  const { golds, totalGold, loading, error, refetch: refetchGolds, create, update, remove } = useGolds()
  const { logs, refetch: refetchLogs } = useGoldLogs()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Gold | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Gold | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [sellOpen, setSellOpen] = useState(false)
  const [sellAmount, setSellAmount] = useState('')
  const [sellDesc, setSellDesc] = useState('')
  const [sellError, setSellError] = useState('')
  const [selling, setSelling] = useState(false)

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (g: Gold) => { setEditing(g); setModalOpen(true) }
  const openSell = () => { setSellOpen(true); setSellAmount(''); setSellDesc(''); setSellError('') }
  const closeSell = () => { setSellOpen(false); setSellAmount(''); setSellDesc(''); setSellError('') }

  const handleSell = async () => {
    const parsed = parseFloat(sellAmount)
    if (!sellAmount || isNaN(parsed) || parsed <= 0) { setSellError('Enter a valid amount.'); return }
    if (parsed > totalGold) { setSellError(`Cannot sell more than ${totalGold.toLocaleString()} G.`); return }
    setSelling(true)
    try {
      await goldsApi.sell(parsed, sellDesc || undefined)
      await Promise.all([refetchGolds(), refetchLogs()])
      toast.success(`Sold ${parsed.toLocaleString()} G.`)
      closeSell()
    } catch (err: unknown) {
      setSellError((err as { message: string }).message)
    } finally {
      setSelling(false)
    }
  }

  const handleSubmit = async (data: { amount: number; description?: string }) => {
    if (editing) {
      await update(editing.id, data)
      toast.success('Gold updated.')
    } else {
      await create(data)
      toast.success('Gold added.')
      await refetchLogs()
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Gold deleted.')
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Golds</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your current gold stashes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openSell} disabled={golds.length === 0}>
            <Minus size={16} className="mr-1" /> Sell Gold
          </Button>
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-1" /> Add Gold
          </Button>
        </div>
      </div>

      {!loading && (
        <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/40 dark:bg-amber-900/10">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 dark:bg-amber-500/20">
            <Coins size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-500 uppercase tracking-wide">Current Gold</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {totalGold.toLocaleString()} <span className="text-base font-semibold">G</span>
            </p>
          </div>
        </div>
      )}

      {loading && <div className="text-center text-gray-400 py-10">Loading…</div>}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      {!loading && golds.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <Coins size={40} className="text-amber-400" />
          <p className="text-gray-500 dark:text-gray-400">No gold stashes yet. Add your first one!</p>
        </Card>
      )}

      {!loading && golds.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {golds.map((g, i) => (
                <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-400 dark:text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {g.description || <span className="text-gray-400 dark:text-gray-500 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                    {Number(g.amount).toLocaleString()} G
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(g)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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

      {/* Gold Log */}
      {logs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Transaction History</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={[
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        log.type === 'add'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      ].join(' ')}>
                        {log.type === 'add' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {log.type === 'add' ? 'Add' : 'Sell'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 italic">
                      {log.description || '—'}
                    </td>
                    <td className={[
                      'px-4 py-3 text-right font-semibold whitespace-nowrap',
                      log.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
                    ].join(' ')}>
                      {log.type === 'add' ? '+' : '-'}{Number(log.amount).toLocaleString()} G
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <GoldModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} gold={editing} />

      <Modal open={sellOpen} onClose={closeSell} title="Sell Gold" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total available: <span className="font-semibold text-amber-600 dark:text-amber-400">{totalGold.toLocaleString()} G</span>
          </p>
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Amount to sell</p>
            <input
              type="text"
              inputMode="decimal"
              value={formatWithCommas(sellAmount)}
              onChange={(e) => {
                const stripped = e.target.value.replace(/,/g, '')
                if (stripped === '' || /^\d*\.?\d*$/.test(stripped)) { setSellAmount(stripped); setSellError('') }
              }}
              placeholder="e.g. 500,000"
              className={[
                'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors',
                'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
                sellError ? 'border-red-400 dark:border-red-500' : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500',
              ].join(' ')}
            />
            {sellError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{sellError}</p>}
          </div>
          <Input
            label="Description (optional)"
            value={sellDesc}
            onChange={(e) => setSellDesc(e.target.value)}
            placeholder="e.g. Sold to buyer"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeSell} disabled={selling}>Cancel</Button>
            <Button onClick={handleSell} loading={selling}>Sell Gold</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Gold Stash"
        message={`Delete gold stash #${deleteTarget?.id}? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
