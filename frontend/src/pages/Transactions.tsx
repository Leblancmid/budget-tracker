import { useState } from 'react'
import { Plus, Search, Filter, Pencil, Trash2, Download } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { TransactionModal, type TransactionFormData } from '@/components/modals/TransactionModal'
import { toast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/utils/format'
import { Amt } from '@/context/AmountVisibilityContext'
import { exportCsv } from '@/utils/csv'
import type { Transaction } from '@/types'

export function Transactions() {
  const { transactions, meta, filters, loading, applyFilters, setPage, create, update, remove } = useTransactions()
  const { categories } = useCategories()

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleSubmit = async (data: TransactionFormData) => {
    if (editTarget) {
      await update(editTarget.id, data)
      toast.success('Transaction updated.')
    } else {
      await create(data)
      toast.success('Transaction added.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Transaction deleted.')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete transaction.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openEdit = (tx: Transaction) => { setEditTarget(tx); setModalOpen(true) }
  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }

  const handleExport = () => exportCsv('transactions', transactions.map((tx) => ({
    date: tx.date, category: tx.category.name, type: tx.type, description: tx.description ?? '', amount: tx.amount,
  })))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <Input
          placeholder="Search description…"
          value={filters.search ?? ''}
          onChange={(e) => applyFilters({ search: e.target.value })}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-56"
        />
        <Select
          placeholder="All types"
          value={filters.type ?? ''}
          onChange={(e) => applyFilters({ type: e.target.value as 'income' | 'expense' | '' })}
          options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]}
          className="w-36"
        />
        <Select
          placeholder="All categories"
          value={filters.category_id ?? ''}
          onChange={(e) => applyFilters({ category_id: e.target.value ? Number(e.target.value) : '' })}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          className="w-44"
        />
        <div className="flex items-center gap-2">
          <Input type="date" value={filters.date_from ?? ''} onChange={(e) => applyFilters({ date_from: e.target.value })} className="w-36" />
          <span className="text-gray-400 dark:text-gray-600 text-sm">to</span>
          <Input type="date" value={filters.date_to ?? ''} onChange={(e) => applyFilters({ date_to: e.target.value })} className="w-36" />
        </div>
        <Select
          value={filters.per_page ?? 10}
          onChange={(e) => applyFilters({ per_page: Number(e.target.value) })}
          options={[10, 25, 50].map((n) => ({ value: n, label: `${n} / page` }))}
          className="w-28"
        />
        <Button
          variant="ghost"
          size="sm"
          icon={<Filter className="h-4 w-4" />}
          onClick={() => applyFilters({ type: '', category_id: '', date_from: '', date_to: '', search: '' })}
          className="text-gray-500 dark:text-gray-400"
        >
          Clear
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Export</Button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Transaction</Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading transactions…</div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found.</p>
            <Button className="mt-4" onClick={openAdd} icon={<Plus className="h-4 w-4" />}>Add your first</Button>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 dark:bg-gray-800/60 dark:border-gray-700/60">
                <tr>
                  {['Date', 'Category', 'Description', 'Type', 'Amount', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors group dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 dark:text-gray-400">{formatDate(tx.date)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tx.category.color }} />
                        <span className="text-gray-700 font-medium dark:text-gray-300">{tx.category.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate dark:text-gray-400">{tx.description ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={tx.type}>{tx.type}</Badge>
                    </td>
                    <td className={['px-5 py-3.5 font-semibold whitespace-nowrap', tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                      {tx.type === 'income' ? '+' : '-'}<Amt value={formatCurrency(tx.amount)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(tx)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-indigo-400">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(tx)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          </div>
        )}
      </Card>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        transaction={editTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction of ${formatCurrency(deleteTarget?.amount ?? 0)}? This action cannot be undone.`}
      />
    </div>
  )
}
