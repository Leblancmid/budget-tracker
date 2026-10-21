import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, Copy, Download, Gauge, Pencil, Plus, Target, Trash2, Wallet } from 'lucide-react'
import { useBudgets } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useCategories'
import { budgetsApi } from '@/api/budgets'
import { Button } from '@/components/ui/Button'
import { MonthNav } from '@/components/ui/MonthNav'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { BudgetModal, type BudgetFormData } from '@/components/modals/BudgetModal'
import { toast } from '@/lib/toast'
import { formatCurrency, MONTHS } from '@/utils/format'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Amt } from '@/components/ui/Amt'
import { exportCsv } from '@/utils/csv'
import type { Budget } from '@/types'

/** How far through the month we are: 0 for future months, 1 for past months. */
function monthProgress(month: number, year: number) {
  const now   = new Date()
  const days  = new Date(year, month, 0).getDate()
  const viewed = year * 12 + month
  const current = now.getFullYear() * 12 + now.getMonth() + 1
  if (viewed < current) return { elapsed: 1, daysLeft: 0, days }
  if (viewed > current) return { elapsed: 0, daysLeft: days, days }
  const day = now.getDate()
  return { elapsed: day / days, daysLeft: days - day + 1, days }
}

function status(pct: number, pace: number) {
  if (pct >= 100) return { label: 'Over',     cls: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',             bar: 'bg-red-500',     Icon: AlertTriangle }
  if (pct >= 80)  return { label: 'Close',    cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',     bar: 'bg-amber-500',   Icon: AlertTriangle }
  if (pace > 0 && pct > pace * 100 + 10)
                  return { label: 'Fast pace', cls: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', bar: 'bg-orange-500',  Icon: Gauge }
  return            { label: 'On track', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', bar: 'bg-emerald-500', Icon: CheckCircle2 }
}

export function Budgets() {
  const { budgets, month, year, loading, setMonth, setYear, create, update, remove, refetch } = useBudgets()
  const { categories, refetch: refetchCategories } = useCategories(month, year)

  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<Budget | null>(null)
  const [presetCategory, setPresetCategory] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [copying, setCopying]           = useState(false)

  const { elapsed, daysLeft } = monthProgress(month, year)

  const handleSubmit = async (data: BudgetFormData) => {
    if (editTarget) {
      await update(editTarget.id, { amount: data.amount })
      await refetch() // recompute spent / percentage
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

  const openEdit = (b: Budget) => { setEditTarget(b); setPresetCategory(null); setModalOpen(true) }
  const openAdd  = (categoryId: number | null = null) => { setEditTarget(null); setPresetCategory(categoryId); setModalOpen(true) }

  const changeMonth = (m: number, y: number) => { setMonth(m); setYear(y) }

  // Copy last month's budgets for categories that don't have one yet
  const prev = new Date(year, month - 2, 1)
  const prevLabel = `${MONTHS[prev.getMonth()]} ${prev.getFullYear()}`
  const copyLastMonth = async () => {
    setCopying(true)
    try {
      const last  = await budgetsApi.getAll(prev.getMonth() + 1, prev.getFullYear())
      const have  = new Set(budgets.map((b) => b.category_id))
      const toAdd = last.filter((b) => !have.has(b.category_id))
      if (toAdd.length === 0) {
        toast.success(last.length === 0 ? `No budgets in ${prevLabel} to copy.` : 'All of last month\'s budgets are already set.')
        return
      }
      for (const b of toAdd) {
        await budgetsApi.create({ category_id: b.category_id, amount: parseFloat(b.amount), month, year })
      }
      await refetch()
      toast.success(`Copied ${toAdd.length} budget${toAdd.length !== 1 ? 's' : ''} from ${prevLabel}.`)
    } catch {
      toast.error('Could not copy last month\'s budgets.')
    } finally {
      setCopying(false)
    }
  }

  const totals = useMemo(() => {
    const budget = budgets.reduce((s, b) => s + parseFloat(b.amount), 0)
    const spent  = budgets.reduce((s, b) => s + (b.spent ?? 0), 0)
    return { budget, spent, remaining: budget - spent, pct: budget > 0 ? (spent / budget) * 100 : 0 }
  }, [budgets])

  const overCount = budgets.filter((b) => (b.percentage ?? 0) >= 100).length
  const sorted    = useMemo(() => [...budgets].sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0)), [budgets])

  // Personal spending this month in categories without a budget
  const budgetedIds = budgets.map((b) => b.category_id)
  const unbudgeted  = categories
    .filter((c) => c.type === 'expense' && !budgetedIds.includes(c.id) && (c.month_total ?? 0) > 0)
    .sort((a, b) => (b.month_total ?? 0) - (a.month_total ?? 0))
  const unbudgetedTotal = unbudgeted.reduce((s, c) => s + (c.month_total ?? 0), 0)

  const over       = totals.spent > totals.budget && totals.budget > 0
  const perDay     = daysLeft > 0 && totals.remaining > 0 ? totals.remaining / daysLeft : 0
  const expectedBy = totals.budget * elapsed

  const handleExport = () => exportCsv(`budgets-${MONTHS[month - 1]}-${year}`, budgets.map((b) => ({
    category: b.category.name, budget: b.amount, spent: b.spent ?? 0, remaining: b.remaining ?? 0, percentage: b.percentage ?? 0,
  })))

  return (
    <div className="flex flex-col gap-5">

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthNav month={month} year={year} onChange={changeMonth} />
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Copy className="h-4 w-4" />} onClick={copyLastMonth} loading={copying} title={`Copy budgets from ${prevLabel}`}>
            <span className="hidden sm:inline">Copy {MONTHS[prev.getMonth()].slice(0, 3)}</span>
          </Button>
          <div className="hidden md:block">
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Export</Button>
          </div>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => openAdd()}>Set Budget</Button>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="h-48 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : totals.budget > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={['flex h-6 w-6 items-center justify-center rounded-lg', over ? 'bg-red-400/20' : 'bg-indigo-400/20'].join(' ')}>
                    <Wallet className={['h-3.5 w-3.5', over ? 'text-red-300' : 'text-indigo-300'].join(' ')} />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{over ? 'Over budget' : 'Left to spend'}</span>
                </div>
                <p className={['text-3xl font-bold', over ? 'text-red-300' : 'text-indigo-200'].join(' ')}>
                  {over && '−'}<Amt value={formatCurrency(Math.abs(totals.remaining))} />
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {Math.round(totals.pct)}% of <Amt value={formatCurrency(totals.budget)} /> used · {budgets.length} budget{budgets.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {perDay > 0 && (
                  <div className="rounded-xl bg-white/5 px-3.5 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Safe per day</p>
                    <p className="text-sm font-bold text-emerald-300"><Amt value={formatCurrency(perDay)} /></p>
                    <p className="text-[10px] text-slate-500">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</p>
                  </div>
                )}
                {overCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/20 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-300" />
                    <span className="text-xs font-semibold text-red-200">{overCount} over budget</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress with "today" marker */}
            <div className="flex flex-col gap-1.5">
              <div className="relative h-2.5 rounded-full bg-white/10">
                <div className={['h-full rounded-full transition-all duration-700', over ? 'bg-red-400' : totals.pct > elapsed * 100 + 10 ? 'bg-amber-400' : 'bg-indigo-400'].join(' ')}
                  style={{ width: `${Math.min(100, totals.pct)}%` }} />
                {elapsed > 0 && elapsed < 1 && (
                  <div className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-white/70" style={{ left: `${elapsed * 100}%`, height: '18px' }} title="Today" />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Spent <b className="text-slate-300"><Amt value={formatCurrency(totals.spent)} /></b></span>
                {elapsed > 0 && elapsed < 1 && (
                  <span>By today you'd expect <b className="text-slate-300"><Amt value={formatCurrency(expectedBy)} /></b></span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Budget cards ───────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/20">
            <Target className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No budgets for {MONTHS[month - 1]} {year}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Set a limit per category, or reuse last month's.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Copy className="h-4 w-4" />} onClick={copyLastMonth} loading={copying}>Copy {prevLabel}</Button>
            <Button onClick={() => openAdd()} icon={<Plus className="h-4 w-4" />}>Set a budget</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((b) => {
            const pct    = b.percentage ?? 0
            const spent  = b.spent ?? 0
            const limit  = parseFloat(b.amount)
            const s      = status(pct, elapsed)
            const left   = limit - spent
            const daily  = daysLeft > 0 && left > 0 ? left / daysLeft : 0
            return (
              <div key={b.id} className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 px-4 pt-4">
                  <CategoryIcon category={b.category} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{b.category.name}</p>
                    <span className={['mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', s.cls].join(' ')}>
                      <s.Icon className="h-3 w-3" /> {s.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(b)} title="Edit"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(b)} title="Remove"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 px-4 py-3.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      <Amt value={formatCurrency(spent)} />
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500"> / <Amt value={formatCurrency(limit)} /></span>
                    </p>
                    <span className={['text-sm font-bold', pct >= 100 ? 'text-red-600 dark:text-red-400' : pct >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'].join(' ')}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className={['h-full rounded-full transition-all duration-700', s.bar].join(' ')} style={{ width: `${Math.min(100, pct)}%` }} />
                    {elapsed > 0 && elapsed < 1 && (
                      <div className="absolute -top-0.5 h-3 w-0.5 rounded-full bg-gray-400 dark:bg-gray-500" style={{ left: `${elapsed * 100}%` }} title="Where you'd be at a steady pace today" />
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/30 px-4 py-2.5 text-[11px]">
                  {left >= 0
                    ? <span className="text-gray-500 dark:text-gray-400"><b className="text-gray-700 dark:text-gray-200"><Amt value={formatCurrency(left)} /></b> left</span>
                    : <span className="font-semibold text-red-600 dark:text-red-400"><Amt value={formatCurrency(-left)} /> over</span>}
                  {daily > 0 && (
                    <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                      <CalendarDays size={11} /> <Amt value={formatCurrency(daily)} />/day
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          <button
            onClick={() => openAdd()}
            className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-indigo-300 hover:text-indigo-500 dark:hover:border-indigo-700 dark:hover:text-indigo-400 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"><Plus size={18} /></div>
            <span className="text-sm font-semibold">Add budget</span>
          </button>
        </div>
      )}

      {/* ── Unbudgeted spending ────────────────────────────────────── */}
      {!loading && unbudgeted.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 border-b border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 px-5 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Unbudgeted spending</p>
            <span className="ml-auto text-xs font-semibold text-amber-700 dark:text-amber-400"><Amt value={formatCurrency(unbudgetedTotal)} /></span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
            {unbudgeted.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-2.5">
                <CategoryIcon category={c} size="sm" />
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">{c.name}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100"><Amt value={formatCurrency(c.month_total ?? 0)} /></span>
                <Button size="sm" variant="secondary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => openAdd(c.id)}>Budget</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <BudgetModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); refetchCategories() }}
        onSubmit={handleSubmit}
        categories={categories}
        budget={editTarget}
        currentMonth={month}
        currentYear={year}
        budgetedCategoryIds={budgetedIds}
        defaultCategoryId={presetCategory}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Remove Budget"
        message={`Remove the ${MONTHS[month - 1]} budget for "${deleteTarget?.category?.name}"?`}
      />
    </div>
  )
}
