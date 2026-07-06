import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Briefcase, TrendingUp, TrendingDown, Archive, RotateCcw } from 'lucide-react'
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
import { isBusinessIncome } from '@/utils/business'
import type { BusinessTransaction, BusinessTransactionType } from '@/types'
import type { BusinessTransactionPayload } from '@/api/business'

const TYPE_LABELS: Record<BusinessTransactionType, string> = {
  account: 'Account',
  gold:    'Gold',
  expense: 'Item',
}

const PER_PAGE = 10

export default function BusinessTransactions() {
  const { transactions, loading, create, update, remove, refetch } = useBusinessTransactions()

  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<BusinessTransaction | null>(null)
  const [defaultType, setDefaultType]   = useState<'account' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BusinessTransaction | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { showArchive, setShowArchive, archivedItems: archivedTxs, archiveLoading, removeFromArchived } = useArchive(businessTransactionsApi.getArchived)

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

  const handleUnarchive = async (tx: BusinessTransaction) => {
    try {
      await businessTransactionsApi.unarchive(tx.id)
      removeFromArchived((t) => t.id !== tx.id)
      await refetch()
      toast.success('Transaction restored.')
    } catch {
      toast.error('Failed to restore transaction.')
    }
  }

  const isSettled = (tx: BusinessTransaction) =>
    tx.type !== 'account' || tx.archived_at != null

  const totalIncome  = useMemo(() => transactions.filter(tx => isSettled(tx) && isBusinessIncome(tx)).reduce((s, tx) => s + parseFloat(tx.amount), 0), [transactions])
  const totalExpense = useMemo(() => transactions.filter(tx => isSettled(tx) && !isBusinessIncome(tx)).reduce((s, tx) => s + parseFloat(tx.amount), 0), [transactions])
  const balance      = totalIncome - totalExpense

  const openEdit       = (tx: BusinessTransaction) => { setDefaultType(tx.type === 'account' ? 'account' : null); setEditTarget(tx); setModalOpen(true) }
  const openAddAccount = () => { setDefaultType('account'); setEditTarget(null); setModalOpen(true) }

  const activeAccountIds = useMemo(
    () => transactions.filter(tx => tx.type === 'account' && tx.account_id != null && tx.archived_at == null).map(tx => tx.account_id as number),
    [transactions]
  )

  return (
    <div className="flex flex-col gap-5">

      {/* Balance Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 p-6 shadow-lg">
        <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-100">Business Balance</p>
            <p className={['text-3xl font-bold mt-0.5', balance >= 0 ? 'text-white' : 'text-red-200'].join(' ')}>
              {formatCurrency(balance)}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-xs text-teal-100">
                <TrendingUp className="h-3.5 w-3.5" />
                {formatCurrency(totalIncome)} in
              </span>
              <span className="text-teal-300/50">·</span>
              <span className="flex items-center gap-1 text-xs text-teal-100">
                <TrendingDown className="h-3.5 w-3.5" />
                {formatCurrency(totalExpense)} out
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* — Accounts — */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Accounts</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={accSearch}
                onChange={(e) => { setAccSearch(e.target.value); setAccPage(1) }}
                placeholder="Search…"
                className="rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 w-36"
              />
            </div>
            <button
              onClick={() => setShowArchive((v) => !v)}
              className={[
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                showArchive
                  ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              <Archive size={14} />
              Archive
            </button>
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openAddAccount}>
              Add Account
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading…</div>
        ) : accPaginated.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{accSearch ? 'No results.' : 'No account transactions yet.'}</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accPaginated.map((tx) => {
                const isIncome = isBusinessIncome(tx)
                return (
                  <div key={tx.id} className="flex items-start gap-3 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 p-4 group">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      {isIncome
                        ? <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
                        : <TrendingDown size={18} className="text-red-500 dark:text-red-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      {tx.type === 'account' ? (
                        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate leading-snug">{tx.description ?? '—'}</p>
                      ) : (
                        <>
                          <p className="font-semibold text-gray-800 dark:text-gray-100 leading-snug">Gold & Item</p>
                          {tx.description && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tx.description}</p>}
                        </>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(tx.date)}</p>
                      <div className="mt-2 text-xs">
                        <span className={['flex items-center gap-1 font-semibold', isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                          {isIncome ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          Profit: {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(tx)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(tx)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={13} />
                      </button>
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

        {/* Archived Transactions */}
        {showArchive && (
          <div className="border-t border-gray-100 dark:border-gray-700/60 px-5 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Archive size={14} className="text-amber-500" />
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Archived Transactions</h3>
            </div>
            {archiveLoading && <p className="text-center text-sm text-gray-400 py-6">Loading…</p>}
            {!archiveLoading && archivedTxs.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">No archived transactions yet.</p>
            )}
            {!archiveLoading && archivedTxs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-70">
                {archivedTxs.map((tx) => {
                  const isIncome = isBusinessIncome(tx)
                  return (
                    <div key={tx.id} className="flex items-start gap-3 rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-800/20 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/40">
                        {isIncome
                          ? <TrendingUp size={16} className="text-gray-400 dark:text-gray-500" />
                          : <TrendingDown size={16} className="text-gray-400 dark:text-gray-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-500 dark:text-gray-400 truncate leading-snug">{tx.description ?? '—'}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(tx.date)}</p>
                        <div className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                          Profit: {formatCurrency(tx.amount)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnarchive(tx)}
                        className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        title="Restore"
                      >
                        <RotateCcw size={13} />
                      </button>
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
