import { useState } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle, Download, CheckCircle2, Wallet } from 'lucide-react'
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

  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<Budget | null>(null)
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

  const yearOptions  = buildYearOptions(6)
  const totalBudget  = budgets.reduce((acc, b) => acc + parseFloat(b.amount), 0)
  const totalSpent   = budgets.reduce((acc, b) => acc + (b.spent ?? 0), 0)
  const totalRemain  = totalBudget - totalSpent
  const overallPct   = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0
  const overBudget   = totalSpent > totalBudget
  const overCount    = budgets.filter((b) => (b.percentage ?? 0) >= 100).length

  const handleExport = () => exportCsv(`budgets-${MONTHS[month - 1]}-${year}`, budgets.map((b) => ({
    category: b.category.name, budget: b.amount, spent: b.spent ?? 0, remaining: b.remaining ?? 0, percentage: b.percentage ?? 0,
  })))

  return (
    <div className="flex flex-col gap-5">

      {/* Toolbar */}
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

      {/* Summary banner */}
      {!loading && totalBudget > 0 && (
        <div className={[
          'relative overflow-hidden rounded-2xl p-6 shadow-lg',
          overBudget
            ? 'bg-gradient-to-br from-red-500 to-rose-700 shadow-red-500/20'
            : 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-indigo-500/20',
        ].join(' ')}>
          <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-4">

            {/* Top row */}
            <div className="flex items-start justify-between gap-4">
              <div className="grid grid-cols-3 gap-6 flex-1">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Budget</p>
                  <p className="text-2xl font-bold text-white mt-1 truncate">
                    <Amt value={formatCurrency(totalBudget)} />
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Spent</p>
                  <p className={['text-2xl font-bold mt-1 truncate', overBudget ? 'text-red-200' : 'text-white'].join(' ')}>
                    <Amt value={formatCurrency(totalSpent)} />
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Remaining</p>
                  <p className={['text-2xl font-bold mt-1 truncate', totalRemain < 0 ? 'text-red-200' : 'text-white'].join(' ')}>
                    <Amt value={formatCurrency(Math.abs(totalRemain))} />
                    {totalRemain < 0 && <span className="text-sm font-normal ml-1 opacity-80">over</span>}
                  </p>
                </div>
              </div>

              {overCount > 0 && (
                <div className="flex items-center gap-1.5 shrink-0 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-200" />
                  <span className="text-xs font-semibold text-white">{overCount} over</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="flex flex-col gap-1.5">
              <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className={['h-full rounded-full transition-all duration-700', overBudget ? 'bg-red-300' : 'bg-white'].join(' ')}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/60">{Math.round(overallPct)}% used</p>
                <p className="text-xs text-white/60">{budgets.length} categories</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 animate-pulse flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-2.5 w-16 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800" />
              <div className="flex justify-between">
                <div className="h-2.5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-2.5 w-16 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Wallet className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No budgets for {MONTHS[month - 1]} {year}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Set a budget to start tracking your spending.</p>
          </div>
          <Button onClick={openAdd} icon={<Plus className="h-4 w-4" />} className="mt-1">
            Set your first budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const pct  = b.percentage ?? 0
            const over = pct >= 100
            const warn = pct >= 80 && !over
            const barColor = over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-emerald-500'

            return (
              <Card key={b.id} className="flex flex-col gap-0 p-0 overflow-hidden">

                {/* Card header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: b.category.color }}
                    >
                      {b.category.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{b.category.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        of <Amt value={formatCurrency(b.amount)} />
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status badge */}
                    {over ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3" /> Over
                      </span>
                    ) : warn ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        <AlertTriangle className="h-3 w-3" /> Warning
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> On track
                      </span>
                    )}

                    <button
                      onClick={() => openEdit(b)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(b)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="px-5 pb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={['text-xs font-semibold', over ? 'text-red-600 dark:text-red-400' : warn ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'].join(' ')}>
                      {pct}% used
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {over
                        ? <span className="text-red-500 dark:text-red-400 font-medium">+<Amt value={formatCurrency((b.spent ?? 0) - parseFloat(b.amount))} /> over</span>
                        : <><Amt value={formatCurrency(b.remaining ?? 0)} /> left</>
                      }
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700/60 overflow-hidden">
                    <div
                      className={['h-full rounded-full transition-all duration-700', barColor].join(' ')}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-700/60">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Spent: <span className={['font-semibold', over ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'].join(' ')}>
                      <Amt value={formatCurrency(b.spent ?? 0)} />
                    </span>
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Budget: <span className="font-semibold text-gray-700 dark:text-gray-300">
                      <Amt value={formatCurrency(b.amount)} />
                    </span>
                  </span>
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
