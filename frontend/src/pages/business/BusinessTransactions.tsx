import { useMemo, useState } from 'react'
import { Plus, Search, Filter, Pencil, Trash2, Briefcase, TrendingUp, TrendingDown } from 'lucide-react'
import { useBusinessTransactions } from '@/hooks/useBusinessTransactions'
import { useMasterDashboard } from '@/hooks/useMasterDashboard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { BusinessTransactionModal } from '@/components/modals/BusinessTransactionModal'
import { toast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/utils/format'
import { isBusinessIncome } from '@/utils/business'
import type { BusinessTransaction, BusinessTransactionType } from '@/types'
import type { BusinessTransactionPayload } from '@/api/business'

const TYPE_OPTIONS = [
  { value: 'account', label: 'Account' },
  { value: 'gold',    label: 'Gold'    },
  { value: 'expense', label: 'Item'    },
]

const TYPE_LABELS: Record<BusinessTransactionType, string> = {
  account: 'Account',
  gold:    'Gold',
  expense: 'Item',
}

const EMPTY_FILTERS = { search: '', type: '' as BusinessTransactionType | '', date_from: '', date_to: '', per_page: 10 }

export default function BusinessTransactions() {
  const { transactions, loading, create, update, remove } = useBusinessTransactions()
  const { stats: masterStats } = useMasterDashboard()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage]       = useState(1)
  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<BusinessTransaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BusinessTransaction | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const applyFilters = (patch: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const q = filters.search.toLowerCase()
      if (q && !(tx.description ?? '').toLowerCase().includes(q)) return false
      if (filters.type && tx.type !== filters.type) return false
      if (filters.date_from && tx.date < filters.date_from) return false
      if (filters.date_to && tx.date > filters.date_to) return false
      return true
    })
  }, [transactions, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / filters.per_page))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * filters.per_page, safePage * filters.per_page)

  const meta = {
    current_page: safePage,
    last_page:    totalPages,
    from:         filtered.length ? (safePage - 1) * filters.per_page + 1 : null,
    to:           Math.min(safePage * filters.per_page, filtered.length) || null,
    total:        filtered.length,
    per_page:     filters.per_page,
  }

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

  const totalIncome  = useMemo(() => transactions.filter(tx => isBusinessIncome(tx)).reduce((s, tx) => s + parseFloat(tx.amount), 0), [transactions])
  const totalExpense = useMemo(() => transactions.filter(tx => !isBusinessIncome(tx)).reduce((s, tx) => s + parseFloat(tx.amount), 0), [transactions])
  const balance      = masterStats?.business_balance ?? 0

  const openEdit = (tx: BusinessTransaction) => { setEditTarget(tx); setModalOpen(true) }
  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }

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
          <button
            onClick={openAdd}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 transition-colors"
            title="Add Transaction"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Input
          placeholder="Search description…"
          value={filters.search}
          onChange={(e) => applyFilters({ search: e.target.value })}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-56"
        />
        <Select
          placeholder="All types"
          value={filters.type}
          onChange={(e) => applyFilters({ type: e.target.value as BusinessTransactionType | '' })}
          options={TYPE_OPTIONS}
          className="w-36"
        />
        <div className="flex items-center gap-2">
          <Input type="date" value={filters.date_from} onChange={(e) => applyFilters({ date_from: e.target.value })} className="w-36" />
          <span className="text-gray-400 dark:text-gray-600 text-sm">to</span>
          <Input type="date" value={filters.date_to} onChange={(e) => applyFilters({ date_to: e.target.value })} className="w-36" />
        </div>
        <Select
          value={filters.per_page}
          onChange={(e) => applyFilters({ per_page: Number(e.target.value) })}
          options={[10, 25, 50].map((n) => ({ value: n, label: `${n} / page` }))}
          className="w-28"
        />
        <Button
          variant="ghost"
          size="sm"
          icon={<Filter className="h-4 w-4" />}
          onClick={() => { setFilters(EMPTY_FILTERS); setPage(1) }}
          className="text-gray-500 dark:text-gray-400"
        >
          Clear
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading transactions…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found.</p>
            <Button className="mt-4" onClick={openAdd} icon={<Plus className="h-4 w-4" />}>Add your first</Button>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 dark:bg-gray-800/60 dark:border-gray-700/60">
                <tr>
                  {['Date', 'Action', 'Type', 'Description', 'Amount', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {paginated.map((tx) => {
                  const isIncome = isBusinessIncome(tx)
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors group dark:hover:bg-gray-800/40">
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 dark:text-gray-400">{formatDate(tx.date)}</td>
                      {/* Action */}
                      <td className="px-5 py-3.5">
                        {tx.action ? (
                          <span className={[
                            'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase',
                            tx.action === 'sell'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                          ].join(' ')}>
                            {tx.action === 'sell' ? '+ Sell' : '− Buy'}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">—</span>
                        )}
                      </td>
                      {/* Type */}
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {TYPE_LABELS[tx.type]}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate dark:text-gray-400">{tx.description ?? '—'}</td>
                      <td className={['px-5 py-3.5 font-semibold whitespace-nowrap', isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
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
                  )
                })}
              </tbody>
            </table>
            <div className="px-5">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          </div>
        )}
      </Card>

      <BusinessTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        transaction={editTarget}
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
