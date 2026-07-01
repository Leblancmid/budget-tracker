import { useState } from 'react'
import { Plus, Pencil, Trash2, Users, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AccountModal } from '@/components/modals/AccountModal'
import { useRucoyAccounts } from '@/hooks/useRucoyAccounts'
import { toast } from '@/components/ui/Toast'
import type { AccountPayload } from '@/api/rucoy'
import type { RucoyAccount } from '@/types'

export default function Accounts() {
  const { accounts, loading, error, create, update, remove } = useRucoyAccounts()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RucoyAccount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RucoyAccount | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (a: RucoyAccount) => { setEditing(a); setModalOpen(true) }

  const handleSubmit = async (data: AccountPayload) => {
    if (editing) {
      await update(editing.id, data)
      toast.success('Account updated.')
    } else {
      await create(data)
      toast.success('Account added.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Account deleted.')
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Accounts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Accounts currently for sale</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1" /> Add Account
        </Button>
      </div>

      {loading && <div className="text-center text-gray-400 py-10">Loading…</div>}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      {!loading && accounts.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <Users size={40} className="text-emerald-400" />
          <p className="text-gray-500 dark:text-gray-400">No accounts listed for sale yet.</p>
        </Card>
      )}

      {!loading && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <Card key={a.id} className="flex items-start gap-4 p-4">
              {a.avatar ? (
                <img
                  src={a.avatar}
                  alt={a.email}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-300 dark:border-emerald-700 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <User size={22} className="text-emerald-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{a.email}</p>
                {a.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{a.description}</p>
                )}
                <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-1">#{a.id}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        account={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Account"
        message={`Delete account "${deleteTarget?.email}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
