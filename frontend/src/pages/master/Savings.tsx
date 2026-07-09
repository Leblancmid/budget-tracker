import { useMemo, useState } from 'react'
import { Plus, Search, Filter, Pencil, Trash2, PiggyBank, TrendingUp, TrendingDown, Download } from 'lucide-react'
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
import { Amt } from '@/context/AmountVisibilityContext'
import { exportCsv } from '@/utils/csv'
import type { Saving, SavingModeOfPayment } from '@/types'
import type { SavingPayload } from '@/api/master'

const MODE_OPTIONS = [
  { value: 'CIMB',     label: 'CIMB'     },
  { value: 'MARIBANK', label: 'MARIBANK' },
  { value: 'GCASH',    label: 'GCash'    },
]

const EMPTY_FILTERS = {
  search:    '',
  type:      '' as 'deposit' | 'withdraw' | '',
  mode:      '' as SavingModeOfPayment | '',
  date_from: '',
  date_to:   '',
  per_page:  10,
}

export default function Savings() {
  const { savings, loading, create, update, remove } = useSavings()

  const [filters, setFilters]           = useState(EMPTY_FILTERS)
  const [page, setPage]                 = useState(1)
  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<Saving | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Saving | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const applyFilters = (patch: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  const hasFilters = filters.search || filters.type || filters.mode || filters.date_from || filters.date_to

  const filtered = useMemo(() => {
    return savings.filter((s) => {
      const q = filters.search.toLowerCase()
      if (q && !(s.description ?? '').toLowerCase().includes(q)) return false
      if (filters.type && s.type !== filters.type) return false
      if (filters.mode && s.mode_of_payment !== filters.mode) return false
      if (filters.date_from && s.date < filters.date_from) return false
      if (filters.date_to   && s.date > filters.date_to)   return false
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

  const totalDeposit  = useMemo(() => savings.reduce((sum, s) => s.type === 'deposit'  ? sum + parseFloat(s.amount) : sum, 0), [savings])
  const totalWithdraw = useMemo(() => savings.reduce((sum, s) => s.type === 'withdraw' ? sum + parseFloat(s.amount) : sum, 0), [savings])
  const balance       = totalDeposit - totalWithdraw
  const balancePositive = balance >= 0

  const openEdit = (s: Saving) => { setEditTarget(s); setModalOpen(true) }
  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }

  const handleExport = () => exportCsv('savings', savings.map((s) => ({
    date: s.date, type: s.type, mode: s.mode_of_payment,
    description: s.description ?? '', amount: s.amount,
  })))

  return (
    <div className="flex flex-col gap-5">

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

        <div className="relative flex flex-col gap-4">
          {/* Primary: balance */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-400/20">
                <PiggyBank className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Savings Balance</span>
            </div>
            <p className={['text-3xl font-bold', balancePositive ? 'text-violet-300' : 'text-red-400'].join(' ')}>
              <Amt value={formatCurrency(balance)} />
            </p>
            <p className="text-xs text-slate-500 mt-1">CIMB · Maribank · GCash</p>
          </div>

          {/* Sub-stats: deposited / withdrawn */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                <TrendingUp className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Deposited</p>
                <p className="text-base font-bold text-emerald-400"><Amt value={formatCurrency(totalDeposit)} /></p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                <TrendingDown className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Withdrawn</p>
                <p className="text-base font-bold text-red-400"><Amt value={formatCurrency(totalWithdraw)} /></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => applyFilters({ search: e.target.value })}
            placeholder="Search…"
            className="rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 w-44"
          />
        </div>
        <Select
          placeholder="All types"
          value={filters.type}
          onChange={(e) => applyFilters({ type: e.target.value as 'deposit' | 'withdraw' | '' })}
          options={[{ value: 'deposit', label: 'Deposit' }, { value: 'withdraw', label: 'Withdraw' }]}
          className="w-28"
        />
        <Select
          placeholder="All modes"
          value={filters.mode}
          onChange={(e) => applyFilters({ mode: e.target.value as SavingModeOfPayment | '' })}
          options={MODE_OPTIONS}
          className="w-28"
        />
        <Input type="date" value={filters.date_from} onChange={(e) => applyFilters({ date_from: e.target.value })} className="w-36" />
        <span className="text-xs text-gray-400 dark:text-gray-600">to</span>
        <Input type="date" value={filters.date_to} onChange={(e) => applyFilters({ date_to: e.target.value })} className="w-36" />
        <Select
          value={filters.per_page}
          onChange={(e) => applyFilters({ per_page: Number(e.target.value) })}
          options={[10, 25, 50].map((n) => ({ value: n, label: `${n} / page` }))}
          className="w-24"
        />
        <div className="flex items-center gap-2 ml-auto">
          {hasFilters && (
            <button
              onClick={() => { setFilters(EMPTY_FILTERS); setPage(1) }}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <Filter size={12} /> Clear
            </button>
          )}
          <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleExport}>Export</Button>
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openAdd}>Add</Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-5 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-5 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 h-3 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <PiggyBank className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {hasFilters ? 'No results match your filters.' : 'No savings yet.'}
              </p>
              {!hasFilters && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start tracking your savings across CIMB, Maribank and GCash.</p>
              )}
            </div>
            {!hasFilters && (
              <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add your first</Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Mode</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Description</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Amount</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {paginated.map((s) => (
                  <tr key={s.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">{formatDate(s.date)}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-gray-100 dark:bg-gray-700/60 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {s.mode_of_payment}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={s.type === 'deposit' ? 'income' : 'expense'}>
                        {s.type === 'deposit' ? 'Deposit' : 'Withdraw'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 max-w-xs truncate text-xs">
                      {s.description ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className={['px-5 py-3.5 text-right font-bold whitespace-nowrap', s.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                      {s.type === 'deposit' ? '+' : '−'}<Amt value={formatCurrency(s.amount)} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700/40">
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
        message={`Delete this ${deleteTarget?.type} of ${formatCurrency(deleteTarget?.amount ?? 0)}? This cannot be undone.`}
      />
    </div>
  )
}