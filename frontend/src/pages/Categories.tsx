import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Download, Pencil, Plus, Search, Tag, Trash2 } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CategoryModal, type CategoryFormData } from '@/components/modals/CategoryModal'
import { toast } from '@/lib/toast'
import { exportCsv } from '@/utils/csv'
import { formatCurrency, MONTHS } from '@/utils/format'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Amt } from '@/components/ui/Amt'
import type { Category, TransactionType } from '@/types'

const NOW_LABEL = `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`

type SortKey = 'month' | 'all' | 'count' | 'name'

export function Categories() {
  const { categories, loading, create, update, remove } = useCategories()

  const [tab, setTab]       = useState<TransactionType>('expense')
  const [search, setSearch] = useState('')
  const [sort, setSort]     = useState<SortKey>('month')

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
      setTab(data.type)
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

  const openEdit = (cat: Category) => { setEditTarget(cat); setModalOpen(true) }
  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }

  const handleExport = () => exportCsv('categories', categories.map((c) => ({
    name: c.name, type: c.type, color: c.color, icon: c.icon, transactions: c.transactions_count ?? 0,
    this_month: c.month_total ?? 0, all_time: c.all_time_total ?? 0,
  })))

  const byType = useMemo(() => ({
    expense: categories.filter((c) => c.type === 'expense'),
    income:  categories.filter((c) => c.type === 'income'),
  }), [categories])

  const monthSum = (list: Category[]) => list.reduce((s, c) => s + (c.month_total ?? 0), 0)
  const expenseMonth = monthSum(byType.expense)
  const incomeMonth  = monthSum(byType.income)
  const topExpense   = [...byType.expense].sort((a, b) => (b.month_total ?? 0) - (a.month_total ?? 0))[0]
  const tabTotal     = tab === 'expense' ? expenseMonth : incomeMonth

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = byType[tab].filter((c) => !q || c.name.toLowerCase().includes(q))
    const sorters: Record<SortKey, (a: Category, b: Category) => number> = {
      month: (a, b) => (b.month_total ?? 0) - (a.month_total ?? 0) || a.name.localeCompare(b.name),
      all:   (a, b) => (b.all_time_total ?? 0) - (a.all_time_total ?? 0),
      count: (a, b) => (b.transactions_count ?? 0) - (a.transactions_count ?? 0),
      name:  (a, b) => a.name.localeCompare(b.name),
    }
    return [...list].sort(sorters[sort])
  }, [byType, tab, search, sort])

  return (
    <div className="flex flex-col gap-5">

      {/* ── Hero ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="h-40 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-400/20">
                    <Tag className="h-3.5 w-3.5 text-indigo-300" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Categories</span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">{NOW_LABEL}</span>
                </div>
                <p className="text-3xl font-bold text-slate-100">{categories.length}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {byType.expense.length} expense · {byType.income.length} income
                </p>
              </div>

              {topExpense && (topExpense.month_total ?? 0) > 0 && (
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <CategoryIcon category={topExpense} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Top spending</p>
                    <p className="text-sm font-semibold text-slate-100">{topExpense.name}</p>
                    <p className="text-xs text-red-300">
                      <Amt value={formatCurrency(topExpense.month_total ?? 0)} />
                      {expenseMonth > 0 && <span className="text-slate-500"> · {Math.round(((topExpense.month_total ?? 0) / expenseMonth) * 100)}% of spending</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10"><ArrowUpRight className="h-3.5 w-3.5 text-red-300" /></div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Spent this month</p>
                  <p className="text-base font-bold text-red-400"><Amt value={formatCurrency(expenseMonth)} /></p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10"><ArrowDownLeft className="h-3.5 w-3.5 text-emerald-300" /></div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Earned this month</p>
                  <p className="text-base font-bold text-emerald-400"><Amt value={formatCurrency(incomeMonth)} /></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all',
                tab === t
                  ? t === 'income' ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-900 dark:text-emerald-400' : 'bg-white text-red-600 shadow-sm dark:bg-gray-900 dark:text-red-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              ].join(' ')}
            >
              {t === 'income' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
              {t === 'income' ? 'Income' : 'Expense'}
              <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-300">{byType[t].length}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="w-48 rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="hidden sm:block rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="month">Sort: this month</option>
          <option value="all">Sort: all-time</option>
          <option value="count">Sort: most used</option>
          <option value="name">Sort: name</option>
        </select>

        <div className="ml-auto flex gap-2">
          <div className="hidden md:block">
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Export</Button>
          </div>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>New Category</Button>
        </div>
      </div>

      {/* ── Category grid ──────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((cat) => {
            const month = cat.month_total ?? 0
            const share = tabTotal > 0 ? month / tabTotal : 0
            const count = cat.transactions_count ?? 0
            const isIncome = cat.type === 'income'
            return (
              <div key={cat.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all">
                <div className="h-1 w-full" style={{ backgroundColor: cat.color }} />
                <div className="flex items-start gap-3 px-4 pt-3.5">
                  <CategoryIcon category={cat} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{cat.name}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {count} transaction{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} title="Edit"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setDeleteError(null); setDeleteTarget(cat) }} title={count > 0 ? 'Has transactions — reassign or delete them first' : 'Delete'}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">This month</p>
                      <p className={['text-xl font-bold', month === 0 ? 'text-gray-300 dark:text-gray-600' : isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-100'].join(' ')}>
                        <Amt value={formatCurrency(month)} />
                      </p>
                    </div>
                    {share > 0 && <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{Math.round(share * 100)}%</span>}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${share * 100}%`, backgroundColor: cat.color }} />
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    All-time <span className="font-semibold text-gray-600 dark:text-gray-300"><Amt value={formatCurrency(cat.all_time_total ?? 0)} /></span>
                  </p>
                </div>
              </div>
            )
          })}

          {/* New category tile */}
          <button
            onClick={openAdd}
            className="flex min-h-[9rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-indigo-300 hover:text-indigo-500 dark:hover:border-indigo-700 dark:hover:text-indigo-400 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"><Plus size={18} /></div>
            <span className="text-sm font-semibold">New {tab} category</span>
          </button>
        </div>
      )}

      {!loading && search && visible.length === 0 && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">No {tab} categories match "{search}".</p>
      )}

      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        category={editTarget}
        defaultType={tab}
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
            : `Delete "${deleteTarget?.name}"? This cannot be undone.`
        }
      />
    </div>
  )
}
