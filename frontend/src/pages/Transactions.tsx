import { useState } from 'react'
import { Plus, Search, Filter, Pencil, Trash2, Download, TrendingUp, TrendingDown } from 'lucide-react'
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

  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<Transaction | null>(null)
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

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(String(t.amount)), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(String(t.amount)), 0)
  const hasFilters   = !!(filters.search || filters.type || filters.category_id || filters.date_from || filters.date_to)

  return (
    <div className="flex flex-col gap-5">

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Top row: search + actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search description…"
              value={filters.search ?? ''}
              onChange={(e) => applyFilters({ search: e.target.value })}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>
            Export
          </Button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            Add
          </Button>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <Select
            placeholder="All types"
            value={filters.type ?? ''}
            onChange={(e) => applyFilters({ type: e.target.value as 'income' | 'expense' | '' })}
            options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]}
            className="w-32"
          />
          <Select
            placeholder="All categories"
            value={filters.category_id ?? ''}
            onChange={(e) => applyFilters({ category_id: e.target.value ? Number(e.target.value) : '' })}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            className="w-40"
          />
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={filters.date_from ?? ''}
              onChange={(e) => applyFilters({ date_from: e.target.value })}
              className="w-36"
            />
            <span className="text-gray-300 dark:text-gray-600 text-sm">→</span>
            <Input
              type="date"
              value={filters.date_to ?? ''}
              onChange={(e) => applyFilters({ date_to: e.target.value })}
              className="w-36"
            />
          </div>
          <Select
            value={filters.per_page ?? 10}
            onChange={(e) => applyFilters({ per_page: Number(e.target.value) })}
            options={[10, 25, 50].map((n) => ({ value: n, label: `${n} / page` }))}
            className="w-28"
          />
          {hasFilters && (
            <button
              onClick={() => applyFilters({ type: '', category_id: '', date_from: '', date_to: '', search: '' })}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors font-medium"
            >
              <Filter className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Summary strip */}
      {!loading && transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-wide">Income</p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                <Amt value={formatCurrency(totalIncome)} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-red-500 dark:text-red-400 uppercase tracking-wide">Expense</p>
              <p className="text-base font-bold text-red-600 dark:text-red-300">
                <Amt value={formatCurrency(totalExpense)} />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 w-40 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-2.5 w-24 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <TrendingUp className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No transactions found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {hasFilters ? 'Try adjusting your filters.' : 'Add your first transaction to get started.'}
              </p>
            </div>
            {!hasFilters && (
              <Button onClick={openAdd} icon={<Plus className="h-4 w-4" />} className="mt-1">
                Add Transaction
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/60">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400 whitespace-nowrap">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Category</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Description</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400 whitespace-nowrap">Amount</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="group hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {formatDate(tx.date)}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold"
                            style={{ backgroundColor: tx.category.color }}
                          >
                            {tx.category.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {tx.category.name}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-3.5 max-w-xs">
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate block">
                          {tx.description || <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={['text-sm font-bold', tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                            {tx.type === 'income' ? '+' : '−'}<Amt value={formatCurrency(tx.amount)} />
                          </span>
                          <Badge variant={tx.type} className="text-[10px]">{tx.type}</Badge>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(tx)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(tx)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700/40">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          </>
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
