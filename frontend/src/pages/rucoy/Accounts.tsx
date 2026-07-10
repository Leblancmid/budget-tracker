import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Users, User, TrendingUp, TrendingDown, DollarSign, Search, Check, Archive, RotateCcw, Download, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pagination } from '@/components/ui/Pagination'
import { AccountModal } from '@/components/modals/AccountModal'
import { useRucoyAccounts } from '@/hooks/useRucoyAccounts'
import { useArchive } from '@/hooks/useArchive'
import { rucoyAccountsApi, type AccountPayload } from '@/api/rucoy'
import { toast } from '@/components/ui/Toast'
import { paginateLocally } from '@/utils/format'
import { exportCsv } from '@/utils/csv'
import type { AccountPaymentStatus, RucoyAccount } from '@/types'

const fmtGold = (n: number) => `${n.toLocaleString()} G`

const PAYMENT_STATUS_STYLES: Record<AccountPaymentStatus, { label: string; className: string }> = {
  not_paid:       { label: 'Not Paid',       className: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  partially_paid: { label: 'Partially Paid', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  fully_paid:     { label: 'Fully Paid',     className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

function AccountCard({ a, onEdit, onArchive, onDelete, archived = false, onUnarchive }: {
  a: RucoyAccount
  onEdit?: () => void
  onArchive?: () => void
  onDelete?: () => void
  archived?: boolean
  onUnarchive?: () => void
}) {
  const profitPositive = (a.profit ?? 0) >= 0

  return (
    <div className={[
      'group relative flex flex-col rounded-xl border bg-white dark:bg-gray-900 transition-all duration-200',
      archived
        ? 'border-gray-100 dark:border-gray-800 opacity-75'
        : 'border-gray-100 dark:border-gray-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm',
    ].join(' ')}>

      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {a.avatar ? (
          <img
            src={a.avatar}
            alt={a.email}
            className="h-11 w-11 shrink-0 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
          />
        ) : (
          <div className={[
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2',
            archived
              ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'
              : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800',
          ].join(' ')}>
            <User className={['h-5 w-5', archived ? 'text-gray-400' : 'text-slate-500 dark:text-slate-400'].join(' ')} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {a.description && (
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 leading-snug">
              {a.description}
            </p>
          )}
          <p className={['text-xs truncate mt-0.5', a.description ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300 font-medium'].join(' ')}>
            {a.email}
          </p>
        </div>

        {/* Actions */}
        <div className={['flex items-center gap-0.5 shrink-0', archived ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'].join(' ')}>
          {archived ? (
            <button
              onClick={onUnarchive}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              title="Restore"
            >
              <RotateCcw size={13} />
            </button>
          ) : (
            <>
              <button
                onClick={onArchive}
                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                title="Mark as done"
              >
                <Check size={13} />
              </button>
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      {(a.price != null || a.cost != null || a.profit != null) && (
        <div className="mx-4 mb-3 grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 overflow-hidden">
          {[
            { label: 'Price',  value: a.price,  color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Cost',   value: a.cost,   color: 'text-gray-600 dark:text-gray-400' },
            { label: 'Profit', value: a.profit, color: profitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center py-2.5 px-1">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</span>
              <span className={['text-xs font-bold mt-0.5', value != null ? color : 'text-gray-300 dark:text-gray-600'].join(' ')}>
                {value != null ? fmtGold(value) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3">
        <span className={['inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', PAYMENT_STATUS_STYLES[a.payment_status].className].join(' ')}>
          {PAYMENT_STATUS_STYLES[a.payment_status].label}
        </span>
        {a.payment_date && (() => {
          const today = new Date(); today.setHours(0, 0, 0, 0)
          const due   = new Date(a.payment_date + 'T00:00:00')
          const diff  = Math.round((due.getTime() - today.getTime()) / 86400000)
          const isPast  = diff < 0
          const isToday = diff === 0
          const isClose = diff > 0 && diff <= 7
          const color = isPast
            ? 'text-red-600 dark:text-red-400'
            : isToday
            ? 'text-orange-500 dark:text-orange-400'
            : isClose
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-emerald-600 dark:text-emerald-400'
          const label = isPast
            ? `${Math.abs(diff)}d overdue`
            : isToday ? 'Due today'
            : `${diff}d left`
          return (
            <span className={['inline-flex items-center gap-1 text-[11px] font-semibold', color].join(' ')}>
              <CalendarClock size={11} />
              {label}
            </span>
          )
        })()}
      </div>
    </div>
  )
}

export default function Accounts() {
  const { accounts, loading, error, create, update, archive, unarchive, remove } = useRucoyAccounts()

  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]   = useState<RucoyAccount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RucoyAccount | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { showArchive, setShowArchive, archivedItems: archivedAccounts, archiveLoading, fetchArchived, removeFromArchived } = useArchive(rucoyAccountsApi.getArchived)

  const [archiveTarget, setArchiveTarget]     = useState<RucoyAccount | null>(null)
  const [archiving, setArchiving]             = useState(false)
  const [unarchiveTarget, setUnarchiveTarget] = useState<RucoyAccount | null>(null)
  const [unarchiving, setUnarchiving]         = useState(false)

  const handleArchive = async () => {
    if (!archiveTarget) return
    const target = archiveTarget
    setArchiving(true)
    setArchiveTarget(null)
    try {
      await archive(target.id)
      if (showArchive) fetchArchived()
      toast.success('Account archived.', {
        action: { label: 'Undo', onClick: () => setUnarchiveTarget(target) },
      })
    } catch {
      toast.error('Failed to archive account.')
    } finally {
      setArchiving(false)
    }
  }

  const handleUnarchive = async () => {
    if (!unarchiveTarget) return
    setUnarchiving(true)
    try {
      await unarchive(unarchiveTarget.id)
      removeFromArchived((a) => a.id !== unarchiveTarget.id)
      toast.success('Account restored.')
    } catch {
      toast.error('Failed to restore account.')
    } finally {
      setUnarchiving(false)
      setUnarchiveTarget(null)
    }
  }

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (a: RucoyAccount) => { setEditing(a); setModalOpen(true) }

  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accounts
    const q = search.trim().toLowerCase()
    return accounts.filter((a) =>
      a.email.toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q)
    )
  }, [accounts, search])

  const { paginated, meta } = paginateLocally(filteredAccounts, page, 6)

  const totals = useMemo(() => {
    let price = 0, cost = 0, profit = 0
    for (const a of accounts) {
      if (a.price  != null) price  += a.price
      if (a.cost   != null) cost   += a.cost
      if (a.profit != null) profit += a.profit
    }
    return { price, cost, profit }
  }, [accounts])

  const handleExport = () => exportCsv('rucoy-accounts', accounts.map((a) => ({
    email: a.email ?? '', description: a.description ?? '', price: a.price ?? '',
    cost: a.cost ?? '', payment_status: a.payment_status,
  })))

  const handleSubmit = async (data: AccountPayload) => {
    if (editing) {
      await update(editing.id, data)
      toast.success('Account updated.')
    } else {
      await create(data)
      toast.success('Account added.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Account deleted.')
    } catch (err: unknown) {
      toast.error((err as { message: string }).message)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {error && <div className="text-red-500 text-sm text-center py-2">{error}</div>}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search accounts…"
            className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

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
          {archivedAccounts.length > 0 && showArchive && (
            <span className="ml-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-[10px] font-bold px-1.5">
              {archivedAccounts.length}
            </span>
          )}
        </button>

        <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleExport}>Export</Button>
        <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>Add Account</Button>
      </div>

      {/* Stats strip */}
      {!loading && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: 'Total Price', value: totals.price, Icon: DollarSign,
              wrapCls: 'border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/60 dark:bg-indigo-900/10',
              iconCls: 'bg-indigo-100 dark:bg-indigo-900/40', iconColor: 'text-indigo-600 dark:text-indigo-400',
              textColor: 'text-indigo-700 dark:text-indigo-300',
            },
            {
              label: 'Total Cost', value: totals.cost, Icon: TrendingDown,
              wrapCls: 'border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900',
              iconCls: 'bg-gray-100 dark:bg-gray-800', iconColor: 'text-gray-500 dark:text-gray-400',
              textColor: 'text-gray-700 dark:text-gray-300',
            },
            {
              label: 'Total Profit', value: totals.profit, Icon: totals.profit >= 0 ? TrendingUp : TrendingDown,
              wrapCls: totals.profit >= 0
                ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/60 dark:bg-emerald-900/10'
                : 'border-red-100 dark:border-red-900/30 bg-red-50/60 dark:bg-red-900/10',
              iconCls: totals.profit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40',
              iconColor: totals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
              textColor: totals.profit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300',
            },
          ].map(({ label, value, Icon, wrapCls, iconCls, iconColor, textColor }) => (
            <div key={label} className={['flex items-center gap-3 rounded-xl border px-4 py-3', wrapCls].join(' ')}>
              <div className={['flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconCls].join(' ')}>
                <Icon className={['h-4 w-4', iconColor].join(' ')} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                <p className={['text-base font-bold', textColor].join(' ')}>{fmtGold(value)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skeleton loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 animate-pulse">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-11 w-11 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
                <div className="flex-1 flex flex-col gap-2 pt-1">
                  <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-2.5 w-36 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
              <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mb-3" />
              <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Users className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No accounts listed yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add accounts you're selling to track price and profit.</p>
          </div>
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>Add Account</Button>
        </div>
      )}

      {/* Active accounts grid */}
      {!loading && accounts.length > 0 && (
        <div className="flex flex-col gap-4">
          {filteredAccounts.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">No accounts match your search.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map((a) => (
                <AccountCard
                  key={a.id}
                  a={a}
                  onEdit={() => openEdit(a)}
                  onArchive={() => setArchiveTarget(a)}
                  onDelete={() => setDeleteTarget(a)}
                />
              ))}
            </div>
          )}
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      )}

      {/* Archive section */}
      {showArchive && (
        <Card className="flex flex-col">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 bg-amber-50/40 dark:bg-amber-900/10">
            <Archive size={13} className="text-amber-500 dark:text-amber-400" />
            <h2 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Archived Accounts</h2>
            {archivedAccounts.length > 0 && (
              <span className="ml-auto text-[11px] font-semibold text-amber-600 dark:text-amber-500">
                {archivedAccounts.length} total
              </span>
            )}
          </div>

          <div className="p-4">
            {archiveLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
                      <div className="flex-1 flex flex-col gap-2 pt-1">
                        <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800" />
                        <div className="h-2.5 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : archivedAccounts.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No archived accounts.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedAccounts.map((a) => (
                  <AccountCard
                    key={a.id}
                    a={a}
                    archived
                    onUnarchive={() => setUnarchiveTarget(a)}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      <AccountModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} account={editing} />

      <ConfirmDialog open={!!archiveTarget} onClose={() => setArchiveTarget(null)} onConfirm={handleArchive} loading={archiving}
        title="Archive Account" message={`Archive "${archiveTarget?.email}"? You can restore it anytime.`} confirmLabel="Archive" />

      <ConfirmDialog open={!!unarchiveTarget} onClose={() => setUnarchiveTarget(null)} onConfirm={handleUnarchive} loading={unarchiving}
        title="Restore Account" message={`Restore "${unarchiveTarget?.email}" back to active accounts?`} confirmLabel="Restore" />

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}
        title="Delete Account" message={`Delete account "${deleteTarget?.email}"? This cannot be undone.`} confirmLabel="Delete" />
    </div>
  )
}
