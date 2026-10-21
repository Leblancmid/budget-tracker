import { useMemo, useState } from 'react'
import { ArrowLeftRight, ExternalLink, Eye, EyeOff, Minus, Pencil, Plus, Receipt, Search, Settings2, Trash2, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useBalanceEntries } from '@/hooks/useBalanceEntries'
import { useBalanceAccounts } from '@/hooks/useBalanceAccounts'
import { BalanceModal } from '@/components/modals/BalanceModal'
import { ManageBalanceAccountsModal } from '@/components/modals/ManageBalanceAccountsModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/lib/toast'
import { formatDate, paginateLocally } from '@/utils/format'
import { colorOf, fmtIn, fmtPhp, fmtUsd, iconOf } from '@/utils/balanceAccounts'
import { Amt } from '@/components/ui/Amt'
import type { BalanceAccount, BalanceAccountConfig, BalanceEntry, BalanceEntryType } from '@/types'
import type { BalanceEntryPayload } from '@/api/master'
import { readNumber, STORAGE_KEYS, writeString } from '@/lib/storage'

const PER_PAGE     = 10

/** USD → ₱ rate for this page; defaults to ₱58 */
const getSavedRate = () => readNumber(STORAGE_KEYS.balancePhpRate, 58)

interface AccountStats { balance: number; count: number; last: string | null }

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

  const stats = useMemo(() => {
    const map = new Map<string, AccountStats>()
    for (const e of entries) {
      const s = map.get(e.account) ?? { balance: 0, count: 0, last: null }
      const amt = parseFloat(e.amount)
      s.balance += e.type === 'add' ? amt : -amt
      s.count   += 1
      if (!s.last || e.date > s.last) s.last = e.date
      map.set(e.account, s)
    }
    return map
  }, [entries])

  const balanceOf = (code: string) => stats.get(code)?.balance ?? 0
  const toPhp     = (a: BalanceAccountConfig, n: number) => (a.currency === 'USD' ? n * phpRate : n)

  const hiddenCount  = accounts.filter((a) => a.hidden_at).length
  const shownAccounts = showHidden ? accounts : accounts.filter((a) => !a.hidden_at)

  // Totals include hidden accounts — hiding only declutters the page, the money still exists
  const totals = useMemo(() => {
    let usd = 0, php = 0, usdCount = 0, phpCount = 0
    for (const a of accounts) {
      const b = balanceOf(a.code)
      if (a.currency === 'USD') { usd += b; usdCount++ } else { php += b; phpCount++ }
    }
    return { usd, php, usdCount, phpCount, net: php + usd * phpRate }
  }, [accounts, stats, phpRate]) // eslint-disable-line react-hooks/exhaustive-deps

  // Allocation of positive balances, in ₱
  const allocation = useMemo(() => {
    const parts = accounts
      .map((a) => ({ a, value: toPhp(a, balanceOf(a.code)) }))
      .filter((p) => p.value > 0)
    const sum = parts.reduce((s, p) => s + p.value, 0)
    return { sum, parts: parts.map((p) => ({ ...p, share: sum > 0 ? p.value / sum : 0 })).sort((x, y) => y.value - x.value) }
  }, [accounts, stats, phpRate]) // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400/20">
                    <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Net Worth</span>
                </div>
                <p className={['text-3xl font-bold', totals.net >= 0 ? 'text-emerald-300' : 'text-red-300'].join(' ')}>
                  <Amt value={fmtPhp(totals.net)} />
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  ≈ <Amt value={fmtUsd(totals.net / phpRate)} /> · across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Exchange rate */}
              <label className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-slate-300">
                <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">1 USD =</span>
                <span className="text-slate-400">₱</span>
                <input
                  type="number" min="0.01" step="0.01" value={phpInput}
                  onChange={(e) => handlePhpRate(e.target.value)}
                  className="w-16 rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                />
              </label>
            </div>

            {/* USD / PHP split */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">USD Balance</p>
                <p className="text-lg font-bold text-sky-300"><Amt value={fmtUsd(totals.usd)} /></p>
                <p className="text-[11px] text-slate-500">
                  <Amt value={fmtPhp(totals.usd * phpRate)} /> · {totals.usdCount} account{totals.usdCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">PHP Balance</p>
                <p className="text-lg font-bold text-violet-300"><Amt value={fmtPhp(totals.php)} /></p>
                <p className="text-[11px] text-slate-500">{totals.phpCount} account{totals.phpCount !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Allocation */}
            {allocation.parts.length > 0 && (
              <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/10">
                  {allocation.parts.map(({ a, share }) => (
                    <div key={a.code} className={['h-full', colorOf(a.color).bar].join(' ')} style={{ width: `${share * 100}%` }} title={`${a.name} ${(share * 100).toFixed(1)}%`} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {allocation.parts.map(({ a, share }) => (
                    <span key={a.code} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className={['h-2 w-2 rounded-full', colorOf(a.color).bar].join(' ')} />
                      {a.name}
                      <span className="font-semibold text-slate-200">{(share * 100).toFixed(share < 0.1 ? 1 : 0)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
              const c       = colorOf(a.color)
              const Icon    = iconOf(a.icon)
              const s       = stats.get(a.code)
              const bal     = s?.balance ?? 0
              const share   = allocation.sum > 0 && bal > 0 ? toPhp(a, bal) / allocation.sum : 0
              const active  = accountFilter === a.code
              return (
                <div
                  key={a.code}
                  role="button"
                  tabIndex={0}
                  onClick={() => changeFilter(setAccountFilter)(active ? null : a.code)}
                  onKeyDown={(e) => { if (e.key === 'Enter') changeFilter(setAccountFilter)(active ? null : a.code) }}
                  title={active ? 'Showing only this account below — click to show all' : 'Show only this account in the history'}
                  className={[
                    'group relative flex flex-col overflow-hidden rounded-xl border bg-white dark:bg-gray-900 cursor-pointer transition-all',
                    active ? ['border-transparent ring-2', c.ring].join(' ') : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm',
                    a.hidden_at ? 'opacity-60' : '',
                  ].join(' ')}
                >
                  <div className={['h-1 w-full', c.swatch].join(' ')} />

                  <div className={['flex items-center gap-3 px-4 py-3', c.soft].join(' ')}>
                    <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', c.iconTile].join(' ')}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {a.name}
                        {a.hidden_at && <span className="ml-1.5 text-[10px] font-semibold uppercase text-gray-400">Hidden</span>}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">{a.currency} account</p>
                    </div>
                    {share > 0 && (
                      <span className="rounded-full bg-white/70 dark:bg-gray-800/70 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {(share * 100).toFixed(share < 0.1 ? 1 : 0)}%
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
                    <div>
                      <p className={['text-2xl font-bold', bal < 0 ? 'text-red-600 dark:text-red-400' : c.text].join(' ')}>
                        <Amt value={fmtIn(a, bal)} />
                      </p>
                      {a.currency === 'USD' && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">≈ <Amt value={fmtPhp(bal * phpRate)} /></p>
                      )}
                    </div>

                    <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className={['h-full rounded-full', c.swatch].join(' ')} style={{ width: `${share * 100}%` }} />
                    </div>

                    <div className="mt-auto flex items-center gap-2">
                      <p className="flex-1 min-w-0 truncate text-[11px] text-gray-400 dark:text-gray-500">
                        {s ? <>Last {formatDate(s.last!)} · {s.count} entr{s.count === 1 ? 'y' : 'ies'}</> : 'No entries yet'}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); openAdd(a.code, 'add') }}
                        className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                      >
                        <Plus size={11} /> Add
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openAdd(a.code, 'sell') }}
                        className="flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        <Minus size={11} /> Sell
                      </button>
                    </div>
                  </div>
                </div>
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
              {paginated.map((e) => {
                const a    = accountByCode.get(e.account)
                const c    = colorOf(a?.color ?? 'slate')
                const Icon = iconOf(a?.icon ?? 'wallet')
                const isAdd = e.type === 'add'
                return (
                  <div key={e.id} className="group flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', c.iconTile].join(' ')}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={['shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', c.badge].join(' ')}>{a?.name ?? e.account}</span>
                        <p className="truncate text-sm text-gray-700 dark:text-gray-200">
                          {e.description || <span className="text-gray-400 dark:text-gray-500">{isAdd ? 'Added' : 'Sold'}</span>}
                        </p>
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1.5">
                        {formatDate(e.date)} · {isAdd ? 'Add' : 'Sell'}
                        {e.transaction_id && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">
                            <Receipt size={9} /> From Transactions
                          </span>
                        )}
                      </p>
                    </div>
                    {e.transaction_id ? (
                      // Owned by a daily transaction — changing it here would make the two drift apart
                      <Link to="/transactions" title="Edit this in Transactions"
                        className="md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20">
                        Edit in Transactions <ExternalLink size={11} />
                      </Link>
                    ) : (
                      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(e)} title="Edit"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(e)} title="Delete"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col items-end shrink-0">
                      <span className={['text-sm font-bold whitespace-nowrap', isAdd ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                        {isAdd ? '+' : '−'}<Amt value={fmtIn(a, parseFloat(e.amount))} />
                      </span>
                      {a?.currency === 'USD' && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">≈ <Amt value={fmtPhp(parseFloat(e.amount) * phpRate)} /></span>
                      )}
                    </div>
                  </div>
                )
              })}
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
