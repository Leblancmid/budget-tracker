import { useMemo, useState } from 'react'
import { Plus, Search, Filter, Pencil, Trash2 } from 'lucide-react'
import { useSavings } from '@/hooks/useSavings'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { SavingModal } from '@/components/modals/SavingModal'
import { toast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Saving, SavingModeOfPayment, SavingTransfer } from '@/types'
import type { SavingPayload } from '@/api/master'

const MODE_OPTIONS = [
  { value: 'CIMB',     label: 'CIMB'     },
  { value: 'MARIBANK', label: 'MARIBANK' },
  { value: 'GCASH',    label: 'GCash'    },
]

const TRANSFER_OPTIONS = [
  { value: 'daily_expenses', label: 'Daily Expenses' },
  { value: 'business',       label: 'Business'       },
]

const TRANSFER_LABELS: Record<SavingTransfer, string> = {
  daily_expenses: 'Daily Expenses',
  business:       'Business',
}

const EMPTY_FILTERS = {
  search:   '',
  type:     '' as 'deposit' | 'withdraw' | '',
  mode:     '' as SavingModeOfPayment | '',
  transfer: '' as SavingTransfer | '',
  date_from: '',
  date_to:   '',
  per_page:  10,
}

export default function Savings() {
  const { savings, loading, create, update, remove } = useSavings()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage]       = useState(1)
  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<Saving | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Saving | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const applyFilters = (patch: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  const filtered = useMemo(() => {
    return savings.filter((s) => {
      const q = filters.search.toLowerCase()
      if (q && !(s.description ?? '').toLowerCase().includes(q)) return false
      if (filters.type && s.type !== filters.type) return false
      if (filters.mode && s.mode_of_payment !== filters.mode) return false
      if (filters.transfer && s.transfer !== filters.transfer) return false
      if (filters.date_from && s.date < filters.date_from) return false
      if (filters.date_to && s.date > filters.date_to) return false
      return true
    })
  }, [savings, filters])

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

  const handleSubmit = async (data: SavingPayload) => {
    if (editTarget) {
      await update(editTarget.id, data)
      toast.success('Saving updated.')
    } else {
      await create(data)
      toast.success('Saving added.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Saving deleted.')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete saving.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openEdit = (s: Saving) => { setEditTarget(s); setModalOpen(true) }
  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }

  return (
    <div className="flex flex-col gap-5">
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
          onChange={(e) => applyFilters({ type: e.target.value as 'deposit' | 'withdraw' | '' })}
          options={[{ value: 'deposit', label: 'Deposit' }, { value: 'withdraw', label: 'Withdraw' }]}
          className="w-36"
        />
        <Select
          placeholder="All modes"
          value={filters.mode}
          onChange={(e) => applyFilters({ mode: e.target.value as SavingModeOfPayment | '' })}
          options={MODE_OPTIONS}
          className="w-36"
        />
        <Select
          placeholder="All transfers"
          value={filters.transfer}
          onChange={(e) => applyFilters({ transfer: e.target.value as SavingTransfer | '' })}
          options={TRANSFER_OPTIONS}
          className="w-40"
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
        <div className="ml-auto">
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Saving</Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading savings…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No savings found.</p>
            <Button className="mt-4" onClick={openAdd} icon={<Plus className="h-4 w-4" />}>Add your first</Button>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 dark:bg-gray-800/60 dark:border-gray-700/60">
                <tr>
                  {['Date', 'Mode', 'Type', 'Transfer', 'Description', 'Amount', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {paginated.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors group dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 dark:text-gray-400">{formatDate(s.date)}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {s.mode_of_payment}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={s.type === 'deposit' ? 'income' : 'expense'}>
                        {s.type === 'deposit' ? 'Deposit' : 'Withdraw'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">
                      {s.transfer ? TRANSFER_LABELS[s.transfer] : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate dark:text-gray-400">{s.description ?? '—'}</td>
                    <td className={['px-5 py-3.5 font-semibold whitespace-nowrap', s.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                      {s.type === 'deposit' ? '+' : '-'}{formatCurrency(s.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-indigo-400">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(s)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          </div>
        )}
      </Card>

      <SavingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        saving={editTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Saving"
        message={`Are you sure you want to delete this ${deleteTarget?.type} of ${formatCurrency(deleteTarget?.amount ?? 0)}? This action cannot be undone.`}
      />
    </div>
  )
}
