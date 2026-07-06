import { useState } from 'react'
import { Plus, Pencil, Trash2, Download } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CategoryModal, type CategoryFormData } from '@/components/modals/CategoryModal'
import { toast } from '@/components/ui/Toast'
import { exportCsv } from '@/utils/csv'
import type { Category } from '@/types'

export function Categories() {
  const { categories, loading, create, update, remove } = useCategories()

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleSubmit = async (data: CategoryFormData) => {
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
      const e = err as { message: string }
      setDeleteError(e.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const openEdit = (cat: Category) => { setEditTarget(cat); setModalOpen(true) }
  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }

  const handleExport = () => exportCsv('categories', categories.map((c) => ({
    name: c.name, type: c.type, color: c.color, transactions: c.transactions_count ?? 0,
  })))

  const income  = categories.filter((c) => c.type === 'income')
  const expense = categories.filter((c) => c.type === 'expense')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end gap-2">
        <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Export</Button>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>New Category</Button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading categories…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[{ label: 'Income', items: income }, { label: 'Expense', items: expense }].map(({ label, items }) => (
            <Card key={label}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label} Categories</h2>
                <Badge variant={label.toLowerCase() as 'income' | 'expense'}>{items.length}</Badge>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {items.length === 0 && (
                  <p className="px-5 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">No {label.toLowerCase()} categories yet.</p>
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
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cat.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{cat.transactions_count ?? 0} transactions</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(cat)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-indigo-400">
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
          ))}
        </div>
      )}

      <CategoryModal
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
            : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
      />
    </div>
  )
}
