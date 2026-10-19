import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Briefcase, Download, Filter, Pencil, Plus, Search, Trash2, TrendingUp, Wallet } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useDashboard } from '@/hooks/useDashboard'
import { useBalanceAccounts } from '@/hooks/useBalanceAccounts'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { TransactionModal, type TransactionFormData } from '@/components/modals/TransactionModal'
import { toast } from '@/components/ui/Toast'
import { formatCurrency, formatDate, formatTime, MONTHS } from '@/utils/format'
import { colorOf, iconOf } from '@/utils/balanceAccounts'
import { CategoryIcon } from '@/utils/categoryIcons'
import { Amt } from '@/context/AmountVisibilityContext'
import { exportCsv } from '@/utils/csv'
import type { Transaction, TransactionScope, TransactionType } from '@/types'

const NOW_LABEL = `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`

function Segmented<T extends string>({ value, options, onChange }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={[
            'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
            value === o.value ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Transactions() {
  const { transactions, meta, filters, loading, applyFilters, setPage, create, update, remove } = useTransactions()
  const { categories } = useCategories()
  const { stats, refetch: refetchStats } = useDashboard()
  const { user } = useAuth()
  const isAdmin = user?.role !== 'daily_only'
  const { accounts, refetch: refetchAccounts } = useBalanceAccounts()

  // Daily amounts are in ₱, so only visible PHP accounts can be linked
  const phpAccounts   = useMemo(() => (isAdmin ? accounts.filter((a) => a.currency === 'PHP' && !a.hidden_at) : []), [accounts, isAdmin])
  const accountByCode = useMemo(() => new Map(accounts.map((a) => [a.code, a])), [accounts])

  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleSubmit = async (data: TransactionFormData) => {
    const payload = { ...data, balance_account: isAdmin ? data.balance_account : undefined }
    if (editTarget) {
      await update(editTarget.id, payload)
      toast.success('Transaction updated.')
    } else {
      await create(payload)
      toast.success(data.scope === 'business' ? 'Business transaction added — not counted in Daily Expenses.' : 'Transaction added.')
    }
    refetchStats()
    refetchAccounts()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await remove(deleteTarget.id)
      toast.success(deleteTarget.balance_entry ? 'Transaction deleted and its Balance entry reversed.' : 'Transaction deleted.')
      setDeleteTarget(null)
      refetchStats()
      refetchAccounts()
    } catch {
      toast.error('Failed to delete transaction.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openEdit = (tx: Transaction) => { setEditTarget(tx); setModalOpen(true) }
  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }

  const handleExport = () => exportCsv('transactions', transactions.map((tx) => ({
    date: tx.date, category: tx.category.name, type: tx.type, scope: tx.scope, account: tx.balance_entry ? (accountByCode.get(tx.balance_entry.account)?.name ?? tx.balance_entry.account) : '',
    description: tx.description ?? '', amount: tx.amount,
  })))

  const hasFilters = !!(filters.search || filters.type || filters.scope || filters.balance_account || filters.category_id || filters.date_from || filters.date_to)

  // Group the current page by day
  const groups = useMemo(() => {
    const out: { date: string; items: Transaction[]; net: number }[] = []
    for (const tx of transactions) {
      let g = out[out.length - 1]
      if (!g || g.date !== tx.date) { g = { date: tx.date, items: [], net: 0 }; out.push(g) }
      g.items.push(tx)
      if (tx.scope !== 'business') g.net += (tx.type === 'income' ? 1 : -1) * parseFloat(tx.amount)
    }
    return out
  }, [transactions])

  const income   = stats?.total_income ?? 0
  const expense  = stats?.total_expense ?? 0
  const net      = income - expense
  const bizIn    = stats?.business_income ?? 0
  const bizOut   = stats?.business_expense ?? 0
  const bizCount = stats?.business_count ?? 0

  return (
    <div className="flex flex-col gap-5">

      {/* ── This month ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 lg:gap-8">
          {/* Personal (Daily Expenses) */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-400/20">
                  <Wallet className="h-3.5 w-3.5 text-indigo-300" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Daily Net</span>
                <span className="text-[10px] font-semibold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">{NOW_LABEL}</span>
              </div>
              <p className={['text-3xl font-bold', net >= 0 ? 'text-emerald-300' : 'text-red-300'].join(' ')}>
                {net >= 0 ? '+' : '−'}<Amt value={formatCurrency(Math.abs(net))} />
              </p>
              <p className="text-xs text-slate-500 mt-1">Personal transactions only</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10"><ArrowDownLeft className="h-3.5 w-3.5 text-emerald-300" /></div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Income</p>
                  <p className="text-base font-bold text-emerald-400"><Amt value={formatCurrency(income)} /></p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10"><ArrowUpRight className="h-3.5 w-3.5 text-red-300" /></div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Expense</p>
                  <p className="text-base font-bold text-red-400"><Amt value={formatCurrency(expense)} /></p>
                </div>
              </div>
            </div>
          </div>

          {/* Business (excluded) */}
          <button
            onClick={() => applyFilters({ scope: filters.scope === 'business' ? '' : 'business' })}
            title="Show only Business transactions"
            className={[
              'flex flex-col justify-between gap-3 rounded-xl px-4 py-3.5 text-left transition-colors lg:min-w-[15rem]',
              filters.scope === 'business' ? 'bg-teal-400/20 ring-1 ring-teal-300/40' : 'bg-white/5 hover:bg-white/10',
            ].join(' ')}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-teal-300" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Business</span>
              <span className="ml-auto text-[10px] font-semibold text-teal-200 bg-teal-400/20 px-2 py-0.5 rounded-full">{bizCount} this month</span>
            </div>
            <div className="flex gap-5">
              <div>
                <p className="text-[10px] text-slate-500">In</p>
                <p className="text-sm font-bold text-emerald-300"><Amt value={formatCurrency(bizIn)} /></p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Out</p>
                <p className="text-sm font-bold text-red-300"><Amt value={formatCurrency(bizOut)} /></p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Not counted in Daily Expenses</p>
          </button>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[12rem]">
            <Input
              placeholder="Search description…"
              value={filters.search ?? ''}
              onChange={(e) => applyFilters({ search: e.target.value })}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="hidden md:block">
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Export</Button>
          </div>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add</Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented<TransactionScope | ''>
            value={filters.scope ?? ''}
            onChange={(v) => applyFilters({ scope: v })}
            options={[{ value: '', label: 'All' }, { value: 'personal', label: 'Personal' }, { value: 'business', label: 'Business' }]}
          />
          <Segmented<TransactionType | ''>
            value={filters.type ?? ''}
            onChange={(v) => applyFilters({ type: v })}
            options={[{ value: '', label: 'All' }, { value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]}
          />
          <Select
            placeholder="All categories"
            value={filters.category_id ?? ''}
            onChange={(e) => applyFilters({ category_id: e.target.value ? Number(e.target.value) : '' })}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            className="w-40 hidden md:block"
          />
          {isAdmin && accounts.some((a) => a.currency === 'PHP') && (
            <Select
              placeholder="All accounts"
              value={filters.balance_account ?? ''}
              onChange={(e) => applyFilters({ balance_account: e.target.value })}
              options={[
                { value: 'none', label: 'No account' },
                ...accounts.filter((a) => a.currency === 'PHP').map((a) => ({ value: a.code, label: a.name })),
              ]}
              className="w-40 hidden md:block"
            />
          )}
          <div className="hidden md:flex items-center gap-1.5">
            <Input type="date" value={filters.date_from ?? ''} onChange={(e) => applyFilters({ date_from: e.target.value })} className="w-36" />
            <span className="text-gray-300 dark:text-gray-600 text-sm">→</span>
            <Input type="date" value={filters.date_to ?? ''} onChange={(e) => applyFilters({ date_to: e.target.value })} className="w-36" />
          </div>
          <Select
            value={filters.per_page ?? 10}
            onChange={(e) => applyFilters({ per_page: Number(e.target.value) })}
            options={[10, 25, 50].map((n) => ({ value: n, label: `${n} / page` }))}
            className="w-28 hidden md:block"
          />
          {hasFilters && (
            <button
              onClick={() => applyFilters({ type: '', scope: '', balance_account: '', category_id: '', date_from: '', date_to: '', search: '' })}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors font-medium"
            >
              <Filter className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── List, grouped by day ───────────────────────────────────── */}
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
              <Button onClick={openAdd} icon={<Plus className="h-4 w-4" />} className="mt-1">Add Transaction</Button>
            )}
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <div key={g.date}>
                <div className="flex items-center justify-between gap-3 bg-gray-50/80 dark:bg-gray-800/40 px-5 py-2 border-y border-gray-100 dark:border-gray-700/60 first:border-t-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{formatDate(g.date)}</span>
                  {g.items.some((t) => t.scope !== 'business') && (
                    <span className={['text-[11px] font-semibold', g.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                      {g.net >= 0 ? '+' : '−'}<Amt value={formatCurrency(Math.abs(g.net))} />
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {g.items.map((tx) => {
                    const isIncome = tx.type === 'income'
                    const isBiz    = tx.scope === 'business'
                    const acct     = tx.balance_entry ? accountByCode.get(tx.balance_entry.account) : undefined
                    const AcctIcon = iconOf(acct?.icon ?? 'wallet')
                    return (
                      <div key={tx.id} className="group flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <CategoryIcon category={tx.category} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{tx.description || tx.category.name}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-gray-400 dark:text-gray-500">
                            <span>{tx.category.name}</span>
                            <span>·</span>
                            <span>{formatTime(tx.created_at)}</span>
                            {isBiz && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 dark:text-teal-300">
                                <Briefcase size={9} /> Business
                              </span>
                            )}
                            {tx.balance_entry && (
                              <span className={['inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', colorOf(acct?.color ?? 'slate').badge].join(' ')}>
                                <AcctIcon size={9} /> {acct?.name ?? tx.balance_entry.account}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(tx)} title="Edit"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(tx)} title="Delete"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className={[
                          'shrink-0 text-sm font-bold whitespace-nowrap',
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
                          isBiz ? 'opacity-80' : '',
                        ].join(' ')}>
                          {isIncome ? '+' : '−'}<Amt value={formatCurrency(tx.amount)} />
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

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
        balanceAccounts={phpAccounts}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Transaction"
        message={`Delete this ${deleteTarget?.type} of ${formatCurrency(deleteTarget?.amount ?? 0)}?${
          deleteTarget?.balance_entry ? ` Its ${accountByCode.get(deleteTarget.balance_entry.account)?.name ?? 'Balance'} entry will be reversed too.` : ''
        } This cannot be undone.`}
      />
    </div>
  )
}
