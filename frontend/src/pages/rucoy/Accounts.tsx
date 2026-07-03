import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Users, User, TrendingUp, TrendingDown, DollarSign, Search, Check, Archive, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pagination } from '@/components/ui/Pagination'
import { AccountModal } from '@/components/modals/AccountModal'
import { useRucoyAccounts } from '@/hooks/useRucoyAccounts'
import { rucoyAccountsApi, type AccountPayload } from '@/api/rucoy'
import { toast } from '@/components/ui/Toast'
import { paginateLocally } from '@/utils/format'
import type { AccountPaymentStatus, RucoyAccount } from '@/types'

const fmtGold = (n: number) => `${n.toLocaleString()} G`

const PAYMENT_STATUS_STYLES: Record<AccountPaymentStatus, { label: string; className: string }> = {
  not_paid:       { label: 'Not Paid',       className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  partially_paid: { label: 'Partially Paid', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  fully_paid:     { label: 'Fully Paid',     className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

export default function Accounts() {
  const { accounts, loading, error, create, update, archive, unarchive, remove } = useRucoyAccounts()

  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RucoyAccount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RucoyAccount | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [showArchive, setShowArchive] = useState(false)
  const [archivedAccounts, setArchivedAccounts] = useState<RucoyAccount[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<RucoyAccount | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [unarchiveTarget, setUnarchiveTarget] = useState<RucoyAccount | null>(null)
  const [unarchiving, setUnarchiving] = useState(false)

  const fetchArchived = useCallback(async () => {
    setArchiveLoading(true)
    try { setArchivedAccounts(await rucoyAccountsApi.getArchived()) }
    finally { setArchiveLoading(false) }
  }, [])

  useEffect(() => { if (showArchive) fetchArchived() }, [showArchive, fetchArchived])

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
      setArchivedAccounts((prev) => prev.filter((a) => a.id !== unarchiveTarget.id))
      toast.success('Account restored.')
    } catch {
      toast.error('Failed to restore account.')
    } finally {
      setUnarchiving(false)
      setUnarchiveTarget(null)
    }
  }

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (a: RucoyAccount) => { setEditing(a); setModalOpen(true) }

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
      if (a.price != null) price += a.price
      if (a.cost != null) cost += a.cost
      if (a.profit != null) profit += a.profit
    }
    return { price, cost, profit }
  }, [accounts])

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Accounts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Accounts currently for sale</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search…"
              className="rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-1.5 text-sm text-gray-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 w-44"
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
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-1" /> Add Account
          </Button>
        </div>
      </div>

      {!loading && accounts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Price', value: totals.price, icon: DollarSign, color: 'bg-indigo-50 dark:bg-indigo-900/20', iconColor: 'text-indigo-500 dark:text-indigo-400', textColor: 'text-indigo-700 dark:text-indigo-400' },
            { label: 'Total Cost',  value: totals.cost,  icon: TrendingDown, color: 'bg-gray-100 dark:bg-gray-800',      iconColor: 'text-gray-500 dark:text-gray-400',   textColor: 'text-gray-700 dark:text-gray-300' },
            { label: 'Total Profit', value: totals.profit, icon: totals.profit >= 0 ? TrendingUp : TrendingDown,
              color: totals.profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20',
              iconColor: totals.profit >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
              textColor: totals.profit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400' },
          ].map(({ label, value, icon: Icon, color, iconColor, textColor }) => (
            <Card key={label} className="flex items-center gap-3 px-4 py-3">
              <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', color].join(' ')}>
                <Icon size={16} className={iconColor} />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</p>
                <p className={['text-base font-bold', textColor].join(' ')}>{fmtGold(value)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {loading && <div className="text-center text-gray-400 py-10">Loading…</div>}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      {!loading && accounts.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <Users size={40} className="text-emerald-400" />
          <p className="text-gray-500 dark:text-gray-400">No accounts listed for sale yet.</p>
        </Card>
      )}

      {!loading && accounts.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.length === 0 && (
            <p className="col-span-3 text-center text-sm text-gray-400 py-6">No accounts match your search.</p>
          )}
          {paginated.map((a) => (
            <Card key={a.id} className="flex items-start gap-4 p-4">
              {a.avatar ? (
                <img
                  src={a.avatar}
                  alt={a.email}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-300 dark:border-emerald-700 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <User size={22} className="text-emerald-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{a.email}</p>
                  <span className={['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', PAYMENT_STATUS_STYLES[a.payment_status].className].join(' ')}>
                    {PAYMENT_STATUS_STYLES[a.payment_status].label}
                  </span>
                </div>
                {a.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{a.description}</p>
                )}
                <div className="mt-2 flex flex-col gap-0.5 text-xs">
                  {a.price != null && (
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      Price: {fmtGold(a.price)}
                    </span>
                  )}
                  {a.cost != null && (
                    <span className="text-gray-500 dark:text-gray-400">
                      Cost: {fmtGold(a.cost)}
                    </span>
                  )}
                  {a.profit != null && (
                    <span className={`flex items-center gap-1 font-semibold ${a.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {a.profit >= 0
                        ? <TrendingUp size={11} />
                        : <TrendingDown size={11} />}
                      Profit: {fmtGold(a.profit)}
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-1.5">#{a.id}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setArchiveTarget(a)}
                  disabled={archiving}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-40 transition-colors"
                  title="Mark as done"
                >
                  <Check size={14} />
                </button>
                <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      )}

      {showArchive && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Archive size={15} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Archived Accounts</h2>
          </div>
          {archiveLoading && <p className="text-center text-sm text-gray-400 py-6">Loading…</p>}
          {!archiveLoading && archivedAccounts.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">No archived accounts yet.</p>
          )}
          {!archiveLoading && archivedAccounts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
              {archivedAccounts.map((a) => (
                <Card key={a.id} className="flex items-start gap-4 p-4">
                  {a.avatar ? (
                    <img src={a.avatar} alt={a.email} className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <User size={22} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-600 dark:text-gray-400 truncate">{a.email}</p>
                    {a.description && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">{a.description}</p>
                    )}
                    <div className="mt-2 flex flex-col gap-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {a.price != null && <span>Price: {fmtGold(a.price)}</span>}
                      {a.cost  != null && <span>Cost: {fmtGold(a.cost)}</span>}
                      {a.profit != null && <span>Profit: {fmtGold(a.profit)}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setUnarchiveTarget(a)}
                    className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    title="Restore"
                  >
                    <RotateCcw size={14} />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <AccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        account={editing}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        loading={archiving}
        title="Archive Account"
        message={`Archive "${archiveTarget?.email}"? You can restore it anytime from the archive.`}
        confirmLabel="Archive"
      />

      <ConfirmDialog
        open={!!unarchiveTarget}
        onClose={() => setUnarchiveTarget(null)}
        onConfirm={handleUnarchive}
        loading={unarchiving}
        title="Restore Account"
        message={`Restore "${unarchiveTarget?.email}" back to active accounts?`}
        confirmLabel="Restore"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Account"
        message={`Delete account "${deleteTarget?.email}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
