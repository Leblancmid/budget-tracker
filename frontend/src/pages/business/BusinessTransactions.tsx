import { useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useBusinessTransactions } from '@/hooks/useBusinessTransactions'
import { useBusinessCategories } from '@/hooks/useBusinessCategories'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { BusinessTransactionModal } from '@/components/modals/BusinessTransactionModal'
import { toast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/utils/format'
import type { BusinessTransaction, BusinessTransactionType } from '@/types'
import type { BusinessTransactionPayload } from '@/api/business'
import { useMemo } from 'react'

const TYPE_LABELS: Record<BusinessTransactionType, string> = {
  account: 'Account',
  gold: 'Gold',
  expense: 'Expense',
}

const TYPE_OPTIONS = [
  { value: 'account', label: 'Account' },
  { value: 'gold', label: 'Gold' },
  { value: 'expense', label: 'Expense' },
]

export default function BusinessTransactions() {
  const { transactions, loading, create, update, remove } = useBusinessTransactions()
  const { categories } = useBusinessCategories()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<BusinessTransactionType | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BusinessTransaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BusinessTransaction | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const q = search.toLowerCase()
      const matchSearch = !q || (tx.description ?? '').toLowerCase().includes(q) || (tx.category?.name ?? '').toLowerCase().includes(q)
      const matchType = !typeFilter || tx.type === typeFilter
      return matchSearch && matchType
    })
  }, [transactions, search, typeFilter])

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

  const openEdit = (tx: BusinessTransaction) => { setEditTarget(tx); setModalOpen(true) }
  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }

  const isIncome = (type: BusinessTransactionType) => type !== 'expense'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search description or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-60"
        />
        <Select
          placeholder="All types"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as BusinessTransactionType | '')}
          options={TYPE_OPTIONS}
          className="w-36"
        />
        {(search || typeFilter) && (
          <button
            onClick={() => { setSearch(''); setTypeFilter('') }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            Clear
          </button>
        )}
        <div className="ml-auto">
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Transaction</Button>
        </div>
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
                  {['Date', 'Type', 'Category', 'Description', 'Amount', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors group dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 dark:text-gray-400">{formatDate(tx.date)}</td>
                    <td className="px-5 py-3.5">
                      <span className={[
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        isIncome(tx.type)
                          ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                      ].join(' ')}>
                        {TYPE_LABELS[tx.type]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {tx.category ? (
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tx.category.color }} />
                          <span className="text-gray-700 font-medium dark:text-gray-300">{tx.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate dark:text-gray-400">{tx.description ?? '—'}</td>
                    <td className={['px-5 py-3.5 font-semibold whitespace-nowrap', isIncome(tx.type) ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                      {isIncome(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(tx)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-teal-600 transition-colors dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-teal-400">
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
          </div>
        )}
      </Card>

      <BusinessTransactionModal
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
        message={`Delete this ${deleteTarget ? TYPE_LABELS[deleteTarget.type] : ''} transaction of ${formatCurrency(deleteTarget?.amount ?? 0)}? This cannot be undone.`}
      />
    </div>
  )
}
