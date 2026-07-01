import { useState } from 'react'
import { Plus, Pencil, Trash2, Coins } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { GoldModal } from '@/components/modals/GoldModal'
import { useGolds } from '@/hooks/useGolds'
import { useToast } from '@/hooks/useToast'
import type { Gold } from '@/types'

export default function Golds() {
  const { golds, loading, error, create, update, remove } = useGolds()
  const { addToast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Gold | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Gold | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (g: Gold) => { setEditing(g); setModalOpen(true) }

  const handleSubmit = async (data: { amount: number }) => {
    if (editing) {
      await update(editing.id, data)
      addToast('Gold updated.', 'success')
    } else {
      await create(data)
      addToast('Gold added.', 'success')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove(deleteTarget.id)
      addToast('Gold deleted.', 'success')
    } catch (err: unknown) {
      addToast((err as { message: string }).message, 'error')
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
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1" /> Add Gold
        </Button>
      </div>

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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trades</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {golds.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400">#{g.id}</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                    {Number(g.amount).toLocaleString()} G
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                    {g.trades?.length ?? 0}
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

      <GoldModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} gold={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Gold Stash"
        message={`Delete gold stash #${deleteTarget?.id}? This cannot be undone if trades are linked.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
