import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Briefcase, TrendingUp, TrendingDown, Archive, Download, BarChart3 } from 'lucide-react'
import { useBusinessTransactions } from '@/hooks/useBusinessTransactions'
import { useArchive } from '@/hooks/useArchive'
import { businessTransactionsApi } from '@/api/business'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { BusinessTransactionModal } from '@/components/modals/BusinessTransactionModal'
import { toast } from '@/components/ui/Toast'
import { formatCurrency, formatDate, paginateLocally } from '@/utils/format'
import { Amt } from '@/context/AmountVisibilityContext'
import { isBusinessIncome } from '@/utils/business'
import { exportCsv } from '@/utils/csv'
import type { BusinessTransaction, BusinessTransactionType } from '@/types'
import type { BusinessTransactionPayload } from '@/api/business'

const TYPE_LABELS: Record<BusinessTransactionType, string> = {
  account: 'Account',
  gold:    'Gold',
  expense: 'Item',
}

const PER_PAGE = 10

export default function BusinessTransactions() {
  const { transactions, loading, create, update, remove } = useBusinessTransactions()

  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<BusinessTransaction | null>(null)
  const [defaultType, setDefaultType]   = useState<'account' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BusinessTransaction | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { showArchive, setShowArchive, archivedItems: archivedTxs, archiveLoading, fetchArchived } = useArchive(businessTransactionsApi.getArchived)

  useEffect(() => { fetchArchived() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [accSearch, setAccSearch] = useState('')
  const [accPage,   setAccPage]   = useState(1)

  const accountTxs = useMemo(() => {
    const q = accSearch.toLowerCase()
    return transactions.filter(tx => tx.archived_at == null && (!q || (tx.description ?? '').toLowerCase().includes(q)))
  }, [transactions, accSearch])

  const { paginated: accPaginated, meta: accMeta } = paginateLocally(accountTxs, accPage, PER_PAGE)

  const handleSubmit = async (data: BusinessTransactionPayload) => {
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

  const settledTxs    = useMemo(() => [...transactions.filter(tx => tx.type !== 'account'), ...archivedTxs], [transactions, archivedTxs])
  const totalIncome   = useMemo(() => settledTxs.filter(tx => tx.price_php != null).reduce((s, tx) => s + parseFloat(tx.price_php!), 0), [settledTxs])
  const totalExpense  = useMemo(() => settledTxs.filter(tx => tx.cost_php  != null).reduce((s, tx) => s + parseFloat(tx.cost_php!),  0), [settledTxs])
  const initialProfit = totalIncome - totalExpense
  const totalProfit   = useMemo(() => archivedTxs.filter(tx => tx.profit_php != null).reduce((s, tx) => s + parseFloat(tx.profit_php!), 0), [archivedTxs])

  const openEdit       = (tx: BusinessTransaction) => { setDefaultType(tx.type === 'account' ? 'account' : null); setEditTarget(tx); setModalOpen(true) }
  const openAddAccount = () => { setDefaultType('account'); setEditTarget(null); setModalOpen(true) }

  const handleExport = () => exportCsv('business-transactions', [...transactions, ...archivedTxs].map((tx) => ({
    date: tx.date, type: tx.type, description: tx.description ?? '', price_php: tx.price_php ?? '', cost_php: tx.cost_php ?? '', profit_php: tx.profit_php ?? '',
  })))

  const activeAccountIds = useMemo(
    () => transactions.filter(tx => tx.type === 'account' && tx.account_id != null && tx.archived_at == null).map(tx => tx.account_id as number),
    [transactions]
  )

  const profitPositive = totalProfit >= 0

  return (
    <div className="flex flex-col gap-5">

      {/* Hero profit banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

        <div className="relative flex flex-col gap-4">
          {/* Primary: profit */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-400/20">
                <BarChart3 className="h-3.5 w-3.5 text-teal-400" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Profit</span>
            </div>
            <p className={['text-3xl font-bold', profitPositive ? 'text-teal-300' : 'text-red-400'].join(' ')}>
              <Amt value={formatCurrency(totalProfit)} />
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Briefcase className="h-3 w-3" />
              Initial profit:
              <span className="font-semibold text-slate-400"><Amt value={formatCurrency(initialProfit)} /></span>
            </p>
          </div>

          {/* Sub-stats: income / cost */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                <TrendingUp className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Income</p>
                <p className="text-base font-bold text-emerald-400"><Amt value={formatCurrency(totalIncome)} /></p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                <TrendingDown className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cost</p>
                <p className="text-base font-bold text-red-400"><Amt value={formatCurrency(totalExpense)} /></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts card */}
      <Card className="flex flex-col">

        {/* Card toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
              <Briefcase className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Accounts</h2>
            {accountTxs.length > 0 && (
              <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 px-2 py-0.5 rounded-full">
                {accountTxs.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={accSearch}
                onChange={(e) => { setAccSearch(e.target.value); setAccPage(1) }}
                placeholder="Search…"
                className="rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 w-36"
              />
            </div>

            {/* Archive toggle */}
            <button
              onClick={() => setShowArchive((v) => !v)}
              className={[
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                showArchive
                  ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              <Archive size={13} />
              Archive
              {archivedTxs.length > 0 && (
                <span className={['rounded-full px-1.5 py-0.5 text-[10px] font-bold', showArchive ? 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'].join(' ')}>
                  {archivedTxs.length}
                </span>
              )}
            </button>

            <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" />} onClick={handleExport}>Export</Button>
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openAddAccount}>Add</Button>
          </div>
        </div>

        {/* Active accounts */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-700/60 p-4 animate-pulse flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-2.5 w-16 rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>
                <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : accPaginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <Briefcase className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {accSearch ? 'No results found.' : 'No account transactions yet.'}
              </p>
              {!accSearch && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add an account to start tracking profit.</p>
              )}
            </div>
            {!accSearch && (
              <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openAddAccount}>Add Account</Button>
            )}
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accPaginated.map((tx) => {
                const isIncome = isBusinessIncome(tx)
                return (
                  <div
                    key={tx.id}
                    className="group relative flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 p-4 hover:border-teal-200 dark:hover:border-teal-700/40 hover:shadow-sm transition-all"
                  >
                    {/* Header row */}
                    <div className="flex items-start gap-3">
                      <div className={[
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        isIncome ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30',
                      ].join(' ')}>
                        {isIncome
                          ? <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                          : <TrendingDown size={16} className="text-red-500 dark:text-red-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm leading-snug">
                          {tx.type === 'account' ? (tx.description ?? '—') : 'Gold & Item'}
                        </p>
                        {tx.type !== 'account' && tx.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{tx.description}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(tx.date)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(tx)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tx)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Profit row */}
                    <div className={[
                      'flex items-center gap-1.5 rounded-lg px-3 py-2',
                      isIncome ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20',
                    ].join(' ')}>
                      {isIncome
                        ? <TrendingUp size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        : <TrendingDown size={12} className="text-red-500 dark:text-red-400 shrink-0" />
                      }
                      <span className="text-xs text-gray-500 dark:text-gray-400">Profit</span>
                      <span className={['text-sm font-bold ml-auto', isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                        <Amt value={formatCurrency(tx.amount)} />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4">
              <Pagination meta={accMeta} onPageChange={setAccPage} />
            </div>
          </div>
        )}

        {/* Archived section */}
        {showArchive && (
          <div className="border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-2 px-5 py-3 bg-amber-50/60 dark:bg-amber-900/10">
              <Archive size={13} className="text-amber-500 dark:text-amber-400" />
              <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Archived Transactions
              </h3>
              <span className="ml-auto text-[11px] font-semibold text-amber-600 dark:text-amber-500">
                {archivedTxs.length} total
              </span>
            </div>

            {archiveLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-700/40 p-4 animate-pulse flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800" />
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800" />
                        <div className="h-2.5 w-14 rounded bg-gray-100 dark:bg-gray-800" />
                      </div>
                    </div>
                    <div className="h-8 rounded-lg bg-gray-100 dark:bg-gray-800" />
                  </div>
                ))}
              </div>
            ) : archivedTxs.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">No archived transactions.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 opacity-75">
                {archivedTxs.map((tx) => {
                  const isIncome = isBusinessIncome(tx)
                  return (
                    <div
                      key={tx.id}
                      className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-800/20 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700/60">
                          {isIncome
                            ? <TrendingUp size={14} className="text-gray-400 dark:text-gray-500" />
                            : <TrendingDown size={14} className="text-gray-400 dark:text-gray-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{tx.description ?? '—'}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-gray-100 dark:bg-gray-700/30 px-3 py-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">Profit</span>
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                          <Amt value={formatCurrency(tx.amount)} />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      <BusinessTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        transaction={editTarget}
        defaultAction={null}
        defaultType={defaultType}
        usedAccountIds={activeAccountIds}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Transaction"
        message={`Are you sure you want to delete this ${deleteTarget ? TYPE_LABELS[deleteTarget.type] : ''} transaction of ${formatCurrency(deleteTarget?.amount ?? 0)}? This action cannot be undone.`}
      />
    </div>
  )
}
