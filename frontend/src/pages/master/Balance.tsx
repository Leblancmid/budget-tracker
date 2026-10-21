import { useMemo, useState } from 'react'
import { Eye, EyeOff, Plus, Search, Settings2, Wallet } from 'lucide-react'

import { useBalanceEntries } from '@/hooks/useBalanceEntries'
import { useBalanceAccounts } from '@/hooks/useBalanceAccounts'
import { BalanceModal } from '@/components/modals/BalanceModal'
import { ManageBalanceAccountsModal } from '@/components/modals/ManageBalanceAccountsModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/lib/toast'
import { paginateLocally } from '@/utils/format'
import { colorOf, fmtIn } from '@/utils/balanceAccounts'
import type { BalanceAccount, BalanceEntry, BalanceEntryType } from '@/types'
import type { BalanceEntryPayload } from '@/api/master'
import { readNumber, STORAGE_KEYS, writeString } from '@/lib/storage'
import { AccountTile } from './balance/AccountTile'
import { BalanceEntryRow } from './balance/BalanceEntryRow'
import { BalanceHero } from './balance/BalanceHero'
import { accountStats, allocation as allocationOf, balanceTotals, toPhp } from './balance/balanceStats'

const PER_PAGE = 10

/** USD → ₱ rate for this page; defaults to ₱58 */
const getSavedRate = () => readNumber(STORAGE_KEYS.balancePhpRate, 58)

export default function Balance() {
  const { entries, loading, create, update, remove } = useBalanceEntries()
  const {
    accounts, loading: accountsLoading, refetch: refetchAccounts,
    create: createAccount, update: updateAccount, reorder: reorderAccounts, remove: removeAccount,
  } = useBalanceAccounts()

  const [phpRate,  setPhpRate]  = useState(getSavedRate)
  const [phpInput, setPhpInput] = useState(() => String(getSavedRate()))

  const [modalOpen,     setModalOpen]     = useState(false)
  const [editTarget,    setEditTarget]    = useState<BalanceEntry | null>(null)
  const [defaultAcc,    setDefaultAcc]    = useState<BalanceAccount | undefined>(undefined)
  const [defaultType,   setDefaultType]   = useState<BalanceEntryType>('add')
  const [deleteTarget,  setDeleteTarget]  = useState<BalanceEntry | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [manageOpen,     setManageOpen]     = useState(false)
  const [manageStartNew, setManageStartNew] = useState(false)
  const [showHidden,     setShowHidden]     = useState(false)

  // History filters
  const [accountFilter, setAccountFilter] = useState<string | null>(null)
  const [typeFilter,    setTypeFilter]    = useState<'all' | BalanceEntryType>('all')
  const [search,        setSearch]        = useState('')
  const [page,          setPage]          = useState(1)

  const accountByCode = useMemo(() => new Map(accounts.map((a) => [a.code, a])), [accounts])

  const stats = useMemo(() => accountStats(entries), [entries])

  const hiddenCount   = accounts.filter((a) => a.hidden_at).length
  const shownAccounts = showHidden ? accounts : accounts.filter((a) => !a.hidden_at)

  // Totals include hidden accounts — hiding only declutters the page, the money still exists
  const totals     = useMemo(() => balanceTotals(accounts, stats, phpRate), [accounts, stats, phpRate])
  const allocation = useMemo(() => allocationOf(accounts, stats, phpRate), [accounts, stats, phpRate])

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (accountFilter && e.account !== accountFilter) return false
      if (typeFilter !== 'all' && e.type !== typeFilter) return false
      if (q && !(e.description ?? '').toLowerCase().includes(q) && !(accountByCode.get(e.account)?.name ?? e.account).toLowerCase().includes(q)) return false
      return true
    })
  }, [entries, accountFilter, typeFilter, search, accountByCode])

  const { paginated, meta } = paginateLocally(filteredEntries, page, PER_PAGE)

  const openAdd = (account: BalanceAccount, type: BalanceEntryType) => {
    setEditTarget(null)
    setDefaultAcc(account)
    setDefaultType(type)
    setModalOpen(true)
  }

  const openEdit = (e: BalanceEntry) => { setEditTarget(e); setModalOpen(true) }

  const openManage = (startNew = false) => {
    refetchAccounts() // refresh entry counts (they decide whether an account can be deleted)
    setManageStartNew(startNew)
    setManageOpen(true)
  }

  const handleSubmit = async (data: BalanceEntryPayload) => {
    if (editTarget) {
      await update(editTarget.id, data)
      toast.success('Entry updated.')
    } else {
      await create(data)
      toast.success('Entry added.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Entry deleted.')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete entry.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handlePhpRate = (val: string) => {
    setPhpInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0) {
      setPhpRate(n)
      writeString(STORAGE_KEYS.balancePhpRate, String(n))
    }
  }

  const changeFilter = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1) }

  // Accounts selectable in the entry dialog: visible ones, plus the edited entry's own account
  const modalAccounts = accounts.filter((a) => !a.hidden_at || a.code === editTarget?.account)

  const isLoading = loading || accountsLoading

  return (
    <div className="flex flex-col gap-5">

      {/* ── Hero: net worth ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="h-52 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <BalanceHero totals={totals} allocation={allocation} accountCount={accounts.length} phpRate={phpRate} phpInput={phpInput} onPhpRateChange={handlePhpRate} />
      )}

      {/* ── Accounts ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Accounts</h2>
          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {shownAccounts.length}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowHidden((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {showHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                {showHidden ? 'Hide hidden' : `Show hidden (${hiddenCount})`}
              </button>
            )}
            <Button size="sm" variant="secondary" icon={<Settings2 className="h-3.5 w-3.5" />} onClick={() => openManage(false)}>
              Manage
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shownAccounts.map((a) => {
              const bal    = stats.get(a.code)?.balance ?? 0
              const active = accountFilter === a.code
              return (
                <AccountTile
                  key={a.code}
                  account={a}
                  stats={stats.get(a.code)}
                  share={allocation.sum > 0 && bal > 0 ? toPhp(a, bal, phpRate) / allocation.sum : 0}
                  phpRate={phpRate}
                  active={active}
                  onToggleFilter={() => changeFilter(setAccountFilter)(active ? null : a.code)}
                  onAdd={(type) => openAdd(a.code, type)}
                />
              )
            })}

            {/* New account tile */}
            <button
              onClick={() => openManage(true)}
              className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-indigo-300 hover:text-indigo-500 dark:hover:border-indigo-700 dark:hover:text-indigo-400 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                <Plus size={18} />
              </div>
              <span className="text-sm font-semibold">Add account</span>
              <span className="text-[11px]">Bank, e-wallet, exchange…</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Transaction history ─────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Transaction History</p>
            <span className="rounded-full bg-gray-100 dark:bg-gray-700/60 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {filteredEntries.length}{filteredEntries.length !== entries.length && ` of ${entries.length}`}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1">
                {(['all', 'add', 'sell'] as const).map((t) => (
                  <button key={t} onClick={() => changeFilter(setTypeFilter)(t)}
                    className={[
                      'rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors',
                      typeFilter === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                    ].join(' ')}>
                    {t === 'all' ? 'All' : t === 'add' ? 'Add' : 'Sell'}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => changeFilter(setSearch)(e.target.value)}
                  placeholder="Search…"
                  className="w-40 rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Account filter chips */}
          {accounts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => changeFilter(setAccountFilter)(null)}
                className={[
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                  accountFilter === null ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                ].join(' ')}>
                All accounts
              </button>
              {accounts.filter((a) => stats.has(a.code)).map((a) => {
                const c = colorOf(a.color)
                const on = accountFilter === a.code
                return (
                  <button key={a.code} onClick={() => changeFilter(setAccountFilter)(on ? null : a.code)}
                    className={[
                      'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                      on ? c.badge + ' ring-1 ' + c.ring : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                    ].join(' ')}>
                    <span className={['h-1.5 w-1.5 rounded-full', c.swatch].join(' ')} />
                    {a.name}
                    <span className="opacity-60">{stats.get(a.code)?.count}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-5 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 h-3 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <Wallet className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {entries.length === 0 ? 'No transactions yet.' : 'No transactions match these filters.'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {entries.length === 0 ? 'Use Add or Sell on an account card.' : 'Try another account, type or search.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
              {paginated.map((e) => (
                <BalanceEntryRow
                  key={e.id}
                  entry={e}
                  account={accountByCode.get(e.account)}
                  phpRate={phpRate}
                  onEdit={() => openEdit(e)}
                  onDelete={() => setDeleteTarget(e)}
                />
              ))}
            </div>
            {meta.last_page > 1 && (
              <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700/40">
                <Pagination meta={meta} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>

      <BalanceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        accounts={modalAccounts}
        entry={editTarget}
        defaultAccount={defaultAcc}
        defaultType={defaultType}
      />

      <ManageBalanceAccountsModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        accounts={accounts}
        startWithNew={manageStartNew}
        onCreate={createAccount}
        onUpdate={updateAccount}
        onReorder={reorderAccounts}
        onDelete={removeAccount}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Entry"
        message={`Delete this ${deleteTarget?.type} of ${
          deleteTarget ? fmtIn(accountByCode.get(deleteTarget.account), parseFloat(deleteTarget.amount)) : ''
        } from ${deleteTarget ? (accountByCode.get(deleteTarget.account)?.name ?? deleteTarget.account) : ''}? This cannot be undone.`}
      />
    </div>
  )
}
