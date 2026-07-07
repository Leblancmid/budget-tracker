import { useState } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle, Download } from 'lucide-react'
import { useBudgets } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { BudgetModal, type BudgetFormData } from '@/components/modals/BudgetModal'
import { toast } from '@/components/ui/Toast'
import { formatCurrency, MONTHS, buildYearOptions } from '@/utils/format'
import { Amt } from '@/context/AmountVisibilityContext'
import { exportCsv } from '@/utils/csv'
import type { Budget } from '@/types'

export function Budgets() {
  const { budgets, month, year, loading, setMonth, setYear, create, update, remove } = useBudgets()
  const { categories } = useCategories()

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Budget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleSubmit = async (data: BudgetFormData) => {
    if (editTarget) {
      await update(editTarget.id, { amount: data.amount })
      toast.success('Budget updated.')
    } else {
      await create(data)
      toast.success('Budget set.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Budget removed.')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete budget.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openEdit = (b: Budget) => { setEditTarget(b); setModalOpen(true) }
  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }

  const yearOptions = buildYearOptions(6)

  const handleExport = () => exportCsv(`budgets-${MONTHS[month - 1]}-${year}`, budgets.map((b) => ({
    category: b.category.name, budget: b.amount, spent: b.spent ?? 0, remaining: b.remaining ?? 0, percentage: b.percentage ?? 0,
  })))

  const totalBudget = budgets.reduce((acc, b) => acc + parseFloat(b.amount), 0)
  const totalSpent  = budgets.reduce((acc, b) => acc + (b.spent ?? 0), 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
            className="w-36"
          />
          <Select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            options={yearOptions}
            className="w-24"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Export</Button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Set Budget</Button>
        </div>
      </div>

      {totalBudget > 0 && (
        <Card className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 font-medium dark:text-gray-400">Total Budget</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100"><Amt value={formatCurrency(totalBudget)} /></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium dark:text-gray-400">Spent</p>
              <p className={['text-xl font-bold', totalSpent > totalBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'].join(' ')}>
                <Amt value={formatCurrency(totalSpent)} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium dark:text-gray-400">Remaining</p>
              <p className={['text-xl font-bold', (totalBudget - totalSpent) < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'].join(' ')}>
                <Amt value={formatCurrency(Math.max(0, totalBudget - totalSpent))} />
              </p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden dark:bg-gray-700">
            <div
              className={['h-full rounded-full transition-all duration-700', totalSpent > totalBudget ? 'bg-red-500' : 'bg-indigo-500'].join(' ')}
              style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 text-right">
            {Math.round((totalSpent / totalBudget) * 100)}% used
          </p>
        </Card>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading budgets…</div>
      ) : budgets.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No budgets set for {MONTHS[month - 1]} {year}.</p>
          <Button className="mt-4" onClick={openAdd} icon={<Plus className="h-4 w-4" />}>Set your first budget</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const over = (b.percentage ?? 0) >= 100
            return (
              <Card key={b.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: b.category.color }}>
                      {b.category.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{b.category.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Budget: <Amt value={formatCurrency(b.amount)} /></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {over && <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />}
                    <button onClick={() => openEdit(b)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-indigo-400">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(b)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-gray-100 overflow-hidden dark:bg-gray-700">
                  <div
                    className={['h-full rounded-full transition-all duration-700', over ? 'bg-red-500' : (b.percentage ?? 0) >= 80 ? 'bg-amber-500' : 'bg-emerald-500'].join(' ')}
                    style={{ width: `${Math.min(100, b.percentage ?? 0)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={over ? 'text-red-600 font-medium dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}>
                    {over ? 'Over budget by ' + formatCurrency((b.spent ?? 0) - parseFloat(b.amount)) : formatCurrency(b.remaining ?? 0) + ' remaining'}
                  </span>
                  <span className={['font-semibold', over ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'].join(' ')}>
                    {b.percentage ?? 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-50 dark:border-gray-700/40 pt-2">
                  <span>Spent: <span className="font-medium text-gray-700 dark:text-gray-300"><Amt value={formatCurrency(b.spent ?? 0)} /></span></span>
                  <span>Budget: <span className="font-medium text-gray-700 dark:text-gray-300"><Amt value={formatCurrency(b.amount)} /></span></span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <BudgetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        budget={editTarget}
        currentMonth={month}
        currentYear={year}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Remove Budget"
        message={`Remove the budget for "${deleteTarget?.category?.name}"?`}
      />
    </div>
  )
}
