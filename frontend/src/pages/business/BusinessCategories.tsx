import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useBusinessCategories } from '@/hooks/useBusinessCategories'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { BusinessCategoryModal, type BusinessCategoryFormData } from '@/components/modals/BusinessCategoryModal'
import { toast } from '@/components/ui/Toast'
import type { BusinessCategory, BusinessTransactionType } from '@/types'

const TYPE_SECTIONS: { type: BusinessTransactionType; label: string }[] = [
  { type: 'account', label: 'Account (Income)' },
  { type: 'gold', label: 'Gold (Income)' },
  { type: 'expense', label: 'Expense' },
]

export default function BusinessCategories() {
  const { categories, loading, create, update, remove } = useBusinessCategories()

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BusinessCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BusinessCategory | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleSubmit = async (data: BusinessCategoryFormData) => {
    if (editTarget) {
      await update(editTarget.id, data)
      toast.success('Category updated.')
    } else {
      await create(data)
      toast.success('Category created.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await remove(deleteTarget.id)
      toast.success('Category deleted.')
      setDeleteTarget(null)
    } catch (err: unknown) {
      setDeleteError((err as { message: string }).message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const openEdit = (cat: BusinessCategory) => { setEditTarget(cat); setModalOpen(true) }
  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>New Category</Button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading categories…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TYPE_SECTIONS.map(({ type, label }) => {
            const items = categories.filter((c) => c.type === type)
            return (
              <Card key={type}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</h2>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">
                    {items.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {items.length === 0 && (
                    <p className="px-5 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">No categories yet.</p>
                  )}
                  {items.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group dark:hover:bg-gray-800/40">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-sm font-bold"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{cat.name}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(cat)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-teal-600 transition-colors dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-teal-400">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { setDeleteError(null); setDeleteTarget(cat) }} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <BusinessCategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        category={editTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Category"
        message={
          deleteError
            ? deleteError
            : `Delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
      />
    </div>
  )
}
