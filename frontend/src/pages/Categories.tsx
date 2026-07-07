import { useState } from 'react'
import { Plus, Pencil, Trash2, Download, TrendingUp, TrendingDown, Tag } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CategoryModal, type CategoryFormData } from '@/components/modals/CategoryModal'
import { toast } from '@/components/ui/Toast'
import { exportCsv } from '@/utils/csv'
import type { Category } from '@/types'

export function Categories() {
  const { categories, loading, create, update, remove } = useCategories()

  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError]   = useState<string | null>(null)

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

  const GROUPS = [
    {
      key:     'income',
      label:   'Income',
      items:   income,
      Icon:    TrendingUp,
      accent:  'text-emerald-600 dark:text-emerald-400',
      iconBg:  'bg-emerald-100 dark:bg-emerald-900/40',
      countBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
    {
      key:     'expense',
      label:   'Expense',
      items:   expense,
      Icon:    TrendingDown,
      accent:  'text-red-500 dark:text-red-400',
      iconBg:  'bg-red-100 dark:bg-red-900/40',
      countBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300',
    },
  ] as const

  return (
    <div className="flex flex-col gap-5">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {categories.length} total &mdash; {income.length} income · {expense.length} expense
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Export</Button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>New Category</Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {GROUPS.map(({ key, label, items, Icon, accent, iconBg, countBg }) => (
          <Card key={key} className="flex flex-col">

            {/* Section header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
              <div className="flex items-center gap-2.5">
                <div className={['flex h-8 w-8 items-center justify-center rounded-lg', iconBg].join(' ')}>
                  <Icon className={['h-4 w-4', accent].join(' ')} />
                </div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</h2>
              </div>
              <span className={['text-xs font-bold px-2 py-0.5 rounded-full', countBg].join(' ')}>
                {items.length}
              </span>
            </div>

            {/* List */}
            <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                    <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="h-2.5 w-16 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                ))
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                    <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-400 dark:text-gray-500">No {label.toLowerCase()} categories yet.</p>
                  <button
                    onClick={openAdd}
                    className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
                  >
                    + Add one
                  </button>
                </div>
              ) : (
                items.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                  >
                    {/* Avatar */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{cat.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {cat.transactions_count ?? 0} transaction{(cat.transactions_count ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Color swatch */}
                    <div
                      className="h-5 w-5 rounded-md border-2 border-white dark:border-gray-800 shadow-sm shrink-0 hidden sm:block"
                      style={{ backgroundColor: cat.color }}
                      title={cat.color}
                    />

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEdit(cat)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeleteError(null); setDeleteTarget(cat) }}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>

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
