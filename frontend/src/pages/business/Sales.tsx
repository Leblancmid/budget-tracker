import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Users, User, Search, Check, Archive, Trash2, Download, ArrowUp, ArrowDown, ArrowUpDown, Receipt, Coins, Link2Off } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pagination } from '@/components/ui/Pagination'
import { RucoyTransactionModal, type AccountPricingPayload, type RucoyTxKind } from '@/components/modals/RucoyTransactionModal'
import { useRucoyAccounts } from '@/hooks/useRucoyAccounts'
import { useArchive } from '@/hooks/useArchive'
import { useBusinessTransactions } from '@/hooks/useBusinessTransactions'
import { useMiddlemanFees } from '@/hooks/useMiddlemanFees'
import { rucoyAccountsApi, type AccountPayload } from '@/api/rucoy'
import { businessTransactionsApi, type BusinessSummary, type BusinessTransactionPayload } from '@/api/business'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'
import { paginateLocally, formatDate, todayISO } from '@/utils/format'
import { exportCsv } from '@/utils/csv'
import type { BusinessTransaction, BusinessTransactionType, RucoyAccount } from '@/types'
import { AccountCard } from './sales/AccountCard'
import { AddGoldModal } from './sales/AddGoldModal'
import { AllTransactionsModal } from './sales/AllTransactionsModal'
import { GoldTradeRow } from './sales/GoldTradeRow'
import { NeedsAttention } from './sales/NeedsAttention'
import { PendingGoldTotals } from './sales/PendingGoldTotals'
import { ProfitPhpBar } from './sales/ProfitPhpBar'
import { SalesHero, type ListedTotals } from './sales/SalesHero'
import { SellGoldModal } from './sales/SellGoldModal'
import { TypePickerModal } from './sales/TypePickerModal'
import {
  BIZ_TYPE_LABELS, CUR_M, CUR_Y, STATUS_FILTERS, isDueSoon, isOverdue, nextSort, txProfitPhp, type StatusFilter,
} from './sales/salesUtils'

const toNum = (v: string | null | undefined) => (v != null ? Number(v) : null)

/** Business → Sales: listed accounts, pending gold trades and everything sold. */
export default function Sales() {
  const { accounts, loading, error, create, update, archive, unarchive, remove } = useRucoyAccounts()

  const [search, setSearch]         = useState('')
  const [profitSort, setProfitSort] = useState<'asc' | 'desc' | null>(null)
  const [priceSort,  setPriceSort]  = useState<'asc' | 'desc' | null>(null)
  const [page, setPage]             = useState(1)
  const [deleteTarget, setDeleteTarget]   = useState<RucoyAccount | null>(null)
  const [deleting, setDeleting]           = useState(false)
  const [convertTarget, setConvertTarget] = useState<RucoyAccount | null>(null)
  const [converting, setConverting]       = useState(false)

  const { showArchive, setShowArchive, archivedItems: archivedAccounts, archiveLoading, fetchArchived, removeFromArchived } = useArchive(rucoyAccountsApi.getArchived)
  const { transactions: bizTxs, loading: bizTxLoading, refetch: refetchBizTxs, create: createBizTx, update: updateBizTx, archive: archiveBizTx, unarchive: unarchiveBizTx, remove: removeBizTx } = useBusinessTransactions()

  // Archived business transactions (sold golds + pricing of sold accounts)
  const [archivedTxs, setArchivedTxs]               = useState<BusinessTransaction[]>([])
  const [archivedTxsLoading, setArchivedTxsLoading] = useState(true)
  const [summary, setSummary] = useState<BusinessSummary | null>(null)

  const refreshArchivedTxs = useCallback(async () => {
    try {
      setArchivedTxs(await businessTransactionsApi.getArchived())
    } catch {
      toast.error('Failed to load sold transactions.')
    } finally {
      setArchivedTxsLoading(false)
    }
  }, [])

  const refreshSummary = useCallback(() => {
    businessTransactionsApi.getSummary(CUR_M + 1, CUR_Y).then(setSummary).catch(() => {})
  }, [])

  useEffect(() => { refreshArchivedTxs(); refreshSummary() }, [refreshArchivedTxs, refreshSummary])

  const afterSoldChange = () => { refreshArchivedTxs(); refreshSummary() }

  const [archivePage, setArchivePage]         = useState(1)
  const [goldArchivePage, setGoldArchivePage] = useState(1)
  const [showTxModal, setShowTxModal]         = useState(false)

  const [archiveTarget, setArchiveTarget]     = useState<RucoyAccount | null>(null)
  const [archiving, setArchiving]             = useState(false)
  const [unarchiveTarget, setUnarchiveTarget] = useState<RucoyAccount | null>(null)
  const [unarchiving, setUnarchiving]         = useState(false)

  const [deletePendingTarget, setDeletePendingTarget]   = useState<BusinessTransaction | null>(null)
  const [deletingPending, setDeletingPending]           = useState(false)
  const [archivePendingTarget, setArchivePendingTarget] = useState<BusinessTransaction | null>(null)
  const [archivingPending, setArchivingPending]         = useState(false)

  const [reclassifyTarget, setReclassifyTarget] = useState<BusinessTransaction | null>(null)
  const [reclassifying, setReclassifying]       = useState(false)

  const [addGoldTarget, setAddGoldTarget] = useState<BusinessTransaction | null>(null)
  const [sellTarget, setSellTarget]       = useState<BusinessTransaction | null>(null)

  // Unified add / edit modal
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [formOpen, setFormOpen]             = useState(false)
  const [formKind, setFormKind]             = useState<RucoyTxKind>('account')
  const [editingAccount, setEditingAccount] = useState<RucoyAccount | null>(null)
  const [editingGold, setEditingGold]       = useState<BusinessTransaction | null>(null)

  // Linked business transaction per account
  const txByAccount = useMemo(() => {
    const map = new Map<number, BusinessTransaction>()
    for (const tx of [...archivedTxs, ...bizTxs]) {
      if (tx.type === 'account' && tx.account_id != null) map.set(tx.account_id, tx)
    }
    return map
  }, [bizTxs, archivedTxs])

  const editingAccountTx = editingAccount ? txByAccount.get(editingAccount.id) ?? null : null

  const openAdd = () => setShowTypePicker(true)
  const openAddKind = (kind: RucoyTxKind) => {
    setShowTypePicker(false)
    setEditingAccount(null); setEditingGold(null); setFormKind(kind); setFormOpen(true)
  }
  const openEditAccount = (a: RucoyAccount) => {
    setEditingGold(null); setEditingAccount(a); setFormKind('account'); setFormOpen(true)
  }
  const openEditGold = (tx: BusinessTransaction) => {
    setEditingAccount(null); setEditingGold(tx); setFormKind('gold'); setFormOpen(true)
  }

  const handleAccountSubmit = async (data: AccountPayload, pricing: AccountPricingPayload | null) => {
    const saved = editingAccount ? await update(editingAccount.id, data) : await create(data)
    if (pricing) {
      try {
        const payload = { ...pricing, account_id: saved.id }
        if (editingAccountTx) await updateBizTx(editingAccountTx.id, payload)
        else await createBizTx(payload)
      } catch {
        toast.error('Account saved, but its pricing could not be saved. Edit it to try again.')
        return
      }
    }
    toast.success(editingAccount ? 'Account updated.' : 'Account added.')
  }

  const handleGoldSubmit = async (data: BusinessTransactionPayload) => {
    if (editingGold) {
      await updateBizTx(editingGold.id, data)
      toast.success('Gold trade updated.')
    } else {
      // The trade's Price (G) also goes into the Golds inventory (Rucoy → Summary)
      await createBizTx({ ...data, add_to_inventory: true })
      toast.success(data.price_gold ? `Gold trade added — ${Number(data.price_gold).toLocaleString()} G added to your stash.` : 'Gold trade added.')
    }
  }

  const handleDeletePending = async () => {
    if (!deletePendingTarget) return
    setDeletingPending(true)
    try {
      await removeBizTx(deletePendingTarget.id)
      toast.success('Transaction removed.')
    } catch {
      toast.error('Failed to remove transaction.')
    } finally {
      setDeletingPending(false)
      setDeletePendingTarget(null)
    }
  }

  const handleUnarchiveTx = async (id: number) => {
    try {
      await unarchiveBizTx(id)
      setArchivedTxs((prev) => prev.filter((t) => t.id !== id))
      refreshSummary()
      toast.success('Transaction restored.')
    } catch {
      toast.error('Failed to restore transaction.')
    }
  }

  const handleArchivePending = async () => {
    if (!archivePendingTarget) return
    const targetId = archivePendingTarget.id
    setArchivingPending(true)
    try {
      await archiveBizTx(targetId)
      afterSoldChange()
      toast.success('Marked as sold.', {
        action: { label: 'Undo', onClick: () => handleUnarchiveTx(targetId) },
      })
    } catch {
      toast.error('Failed to mark as sold.')
    } finally {
      setArchivingPending(false)
      setArchivePendingTarget(null)
    }
  }

  const handleReclassify = async () => {
    if (!reclassifyTarget) return
    const tx = reclassifyTarget
    setReclassifying(true)
    try {
      await updateBizTx(tx.id, {
        type:          'gold',
        action:        tx.action,
        amount:        Number(tx.amount),
        date:          tx.date,
        description:   tx.description,
        notes:         tx.notes,
        price_rate:    toNum(tx.price_rate),
        cost_rate:     toNum(tx.cost_rate),
        php_rate:      toNum(tx.php_rate),
        cost_php_rate: toNum(tx.cost_php_rate),
        price_php:     toNum(tx.price_php),
        cost_php:      toNum(tx.cost_php),
      })
      toast.success('Reclassified as Gold.')
    } catch {
      toast.error('Failed to reclassify transaction.')
    } finally {
      setReclassifying(false)
      setReclassifyTarget(null)
    }
  }

  const handleArchive = async () => {
    if (!archiveTarget) return
    const target = archiveTarget
    setArchiving(true)
    setArchiveTarget(null)
    try {
      await archive(target.id)
      // The API also archives the account's linked business transaction
      refetchBizTxs()
      afterSoldChange()
      if (showArchive) fetchArchived()
      toast.success('Account marked as sold.', {
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
      refetchBizTxs()
      afterSoldChange()
      toast.success('Account restored.')
    } catch {
      toast.error('Failed to restore account.')
    } finally {
      setUnarchiving(false)
      setUnarchiveTarget(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const linked = txByAccount.get(deleteTarget.id)
      if (linked) await removeBizTx(linked.id)
      await remove(deleteTarget.id)
      toast.success('Account deleted.')
    } catch (err: unknown) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // Move an account's transaction into Pending Gold Trades and remove the account card
  const handleConvertToGold = async () => {
    if (!convertTarget) return
    const a  = convertTarget
    const tx = txByAccount.get(a.id)
    const payload: BusinessTransactionPayload = {
      type:          'gold',
      action:        null,
      account_id:    null,
      amount:        tx ? Number(tx.amount) : 0.01,
      description:   a.description || a.email,
      date:          tx?.date ?? todayISO(),
      notes:         `Converted from account: ${a.email}`,
      price_gold:    a.price,
      cost_gold:     a.cost,
      price_rate:    toNum(tx?.price_rate),
      cost_rate:     toNum(tx?.cost_rate),
      php_rate:      toNum(tx?.php_rate),
      cost_php_rate: toNum(tx?.cost_php_rate),
      price_php:     toNum(tx?.price_php),
      cost_php:      toNum(tx?.cost_php),
    }
    setConverting(true)
    try {
      if (tx) await updateBizTx(tx.id, payload)
      else await createBizTx(payload)
    } catch {
      toast.error('Failed to convert to gold trade.')
      setConverting(false)
      setConvertTarget(null)
      return
    }
    try {
      await remove(a.id)
      toast.success(`"${a.description || a.email}" moved to Pending Gold Trades.`)
    } catch {
      toast.error('Gold trade created, but the account could not be removed. Delete it manually.')
    } finally {
      setConverting(false)
      setConvertTarget(null)
    }
  }

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase()
    let result = q
      ? accounts.filter((a) =>
          a.email.toLowerCase().includes(q) ||
          (a.description ?? '').toLowerCase().includes(q)
        )
      : [...accounts]
    if (profitSort) {
      result = result.slice().sort((a, b) => {
        const pa = a.profit ?? 0
        const pb = b.profit ?? 0
        return profitSort === 'asc' ? pa - pb : pb - pa
      })
    } else if (priceSort) {
      result = result.slice().sort((a, b) => {
        const pa = a.price ?? 0
        const pb = b.price ?? 0
        return priceSort === 'asc' ? pa - pb : pb - pa
      })
    }
    return result
  }, [accounts, search, profitSort, priceSort])

  // ── Tabs, payment-status filter and "needs attention" counts ──
  const [tab, setTab]                   = useState<'accounts' | 'gold' | 'sold'>('accounts')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [soldKind, setSoldKind]         = useState<'account' | 'gold'>('account')
  useEffect(() => { if (tab === 'sold') setShowArchive(true) }, [tab, setShowArchive])

  const matchesStatus = useCallback((a: RucoyAccount, f: StatusFilter) => {
    if (f === 'all')     return true
    if (f === 'pricing') return txProfitPhp(txByAccount.get(a.id)) == null
    if (f === 'overdue') return isOverdue(a)
    if (f === 'due')     return isDueSoon(a)
    return a.payment_status === f
  }, [txByAccount])

  const statusCounts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: 0, not_paid: 0, partially_paid: 0, fully_paid: 0, overdue: 0, due: 0, pricing: 0 }
    for (const a of accounts) (Object.keys(c) as StatusFilter[]).forEach((f) => { if (matchesStatus(a, f)) c[f]++ })
    return c
  }, [accounts, matchesStatus])

  const accountsShown = filteredAccounts.filter((a) => matchesStatus(a, statusFilter))
  const { paginated, meta } = paginateLocally(accountsShown, page, 9)

  const goldAwaiting = bizTxs.filter((tx) => tx.type === 'gold' && tx.archived_at == null && tx.price_php == null).length
  const showStatus = (f: StatusFilter) => { setTab('accounts'); setStatusFilter(f); setPage(1) }

  // Middleman fees received this month — shown on the permanent Middleman Fee trade
  const { fees: mmFees, refetch: refetchMmFees } = useMiddlemanFees()
  const mmFeesThisMonth = useMemo(() => mmFees
    .filter((fee) => { const d = new Date(fee.created_at); return d.getMonth() === CUR_M && d.getFullYear() === CUR_Y })
    .reduce((sum, fee) => sum + Number(fee.amount), 0), [mmFees])

  // Permanent (system) trades — e.g. Middleman Fee — always first
  const pendingGoldTrades = useMemo(() =>
    bizTxs
      .filter(tx => tx.type === 'gold' && tx.archived_at == null)
      .sort((a, b) => Number(!!b.system_key) - Number(!!a.system_key)),
    [bizTxs]
  )
  const archivedGoldTrades = useMemo(() => archivedTxs.filter(tx => tx.type === 'gold'), [archivedTxs])

  // Active account transactions whose account is no longer active (e.g. deleted)
  const unlinkedAccountTxs = useMemo(() => {
    if (loading) return []
    const activeIds = new Set(accounts.map((a) => a.id))
    return bizTxs.filter((tx) => tx.type === 'account' && (tx.account_id == null || !activeIds.has(tx.account_id)))
  }, [bizTxs, accounts, loading])

  const allTxsSorted = useMemo(() =>
    [...bizTxs, ...archivedTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [bizTxs, archivedTxs]
  )

  const handleExport = () => exportCsv('rucoy-transactions', [
    ...accounts.map((a) => {
      const tx = txByAccount.get(a.id)
      return {
        type: 'account', date: tx?.date ?? '', description: a.description ?? '', email: a.email ?? '',
        payment_status: a.payment_status, price_gold: a.price ?? '', cost_gold: a.cost ?? '',
        price_php: tx?.price_php ?? '', cost_php: tx?.cost_php ?? '', profit_php: tx?.profit_php ?? '',
      }
    }),
    ...pendingGoldTrades.map((tx) => ({
      type: 'gold', date: tx.date, description: tx.description ?? '', email: '',
      payment_status: '', price_gold: tx.price_gold ?? '', cost_gold: tx.cost_gold ?? '',
      price_php: tx.price_php ?? '', cost_php: tx.cost_php ?? '', profit_php: tx.profit_php ?? '',
    })),
  ])

  // Listed (unsold) accounts: G totals, plus ₱ totals for those with rates set
  const totals = useMemo((): ListedTotals => {
    let price = 0, cost = 0, profit = 0, pricePhp = 0, costPhp = 0, profitPhp = 0
    for (const a of accounts) {
      if (a.price  != null) price  += a.price
      if (a.cost   != null) cost   += a.cost
      if (a.profit != null) profit += a.profit
      const tx = txByAccount.get(a.id)
      const p  = txProfitPhp(tx)
      if (tx && p != null) {
        pricePhp  += parseFloat(tx.price_php ?? '0')
        costPhp   += parseFloat(tx.cost_php ?? '0')
        profitPhp += p
      }
    }
    return { price, cost, profit, pricePhp, costPhp, profitPhp }
  }, [accounts, txByAccount])

  return (
    <div className="flex flex-col gap-5">

      {error && <div className="text-red-500 text-sm text-center py-2">{error}</div>}

      <SalesHero summary={summary} totals={totals} accountCount={accounts.length} />

      {/* ── Needs attention ─────────────────────────────────────────── */}
      {!loading && (
        <NeedsAttention counts={statusCounts} goldAwaiting={goldAwaiting} onShowStatus={showStatus} onShowGold={() => setTab('gold')} />
      )}

      {/* ── Tabs + toolbar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          {([
            { key: 'accounts', label: 'Accounts',    Icon: Users,   count: accounts.length },
            { key: 'gold',     label: 'Gold trades', Icon: Coins,   count: pendingGoldTrades.length },
            { key: 'sold',     label: 'Sold',        Icon: Archive, count: showArchive ? archivedAccounts.length + archivedGoldTrades.length : null },
          ] as const).map(({ key, label, Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={[
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all',
                tab === key ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              ].join(' ')}
            >
              <Icon size={14} />
              {label}
              {count != null && (
                <span className={['rounded-full px-1.5 text-[10px] font-bold', tab === key ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' : 'bg-gray-200/70 text-gray-500 dark:bg-gray-700 dark:text-gray-400'].join(' ')}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'accounts' && (
          <>
            <div className="relative min-w-0 flex-1 max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search accounts…"
                className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div className="hidden md:flex items-center divide-x divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
              <button
                onClick={() => { setPriceSort(null); setProfitSort(nextSort); setPage(1) }}
                className={['flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors', profitSort ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'].join(' ')}
              >
                <SortIcon sort={profitSort} />
                Profit
              </button>
              <button
                onClick={() => { setProfitSort(null); setPriceSort(nextSort); setPage(1) }}
                className={['flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors', priceSort ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'].join(' ')}
              >
                <SortIcon sort={priceSort} />
                Price
              </button>
            </div>
          </>
        )}

        {tab === 'sold' && (
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1">
            {([['account', 'Accounts', archivedAccounts.length], ['gold', 'Golds', archivedGoldTrades.length]] as const).map(([k, label, n]) => (
              <button key={k} onClick={() => setSoldKind(k)}
                className={['rounded-md px-2.5 py-1 text-xs font-semibold transition-colors', soldKind === k ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'].join(' ')}>
                {label} <span className="opacity-60">{n}</span>
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center divide-x divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <button onClick={() => setShowTxModal(true)} title="All transactions"
              className="flex items-center px-2.5 py-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors">
              <Receipt size={14} />
            </button>
            <button onClick={handleExport} title="Export CSV"
              className="flex items-center px-2.5 py-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors">
              <Download size={14} />
            </button>
          </div>
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openAdd}>Add Transaction</Button>
        </div>
      </div>

      {/* ── Accounts tab ────────────────────────────────────────────── */}
      {tab === 'accounts' && (
        <>
          {!loading && accounts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.filter(([f]) => f === 'all' || statusCounts[f] > 0 || statusFilter === f).map(([f, label]) => (
                <button key={f} onClick={() => { setStatusFilter(f); setPage(1) }}
                  className={[
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                    statusFilter === f ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                  ].join(' ')}>
                  {label}
                  <span className="opacity-60">{f === 'all' ? accounts.length : statusCounts[f]}</span>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 animate-pulse">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-11 w-11 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
                    <div className="flex-1 flex flex-col gap-2 pt-1">
                      <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="h-2.5 w-36 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                  <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mb-2" />
                  <div className="h-8 rounded-lg bg-gray-100 dark:bg-gray-800 mb-3" />
                  <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          )}

          {!loading && accounts.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                <Users className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No accounts listed yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add accounts you're selling to track price and profit.</p>
              </div>
              <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Transaction</Button>
            </div>
          )}

          {!loading && accounts.length > 0 && (
            <div className="flex flex-col gap-4">
              {accountsShown.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10">
                  <p className="text-sm text-gray-400 dark:text-gray-500">No accounts match {search ? 'your search' : 'this filter'}.</p>
                  <button onClick={() => { setSearch(''); setStatusFilter('all'); setPage(1) }} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Show all accounts</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginated.map((a) => (
                    <AccountCard
                      key={a.id}
                      a={a}
                      tx={txByAccount.get(a.id)}
                      onEdit={() => openEditAccount(a)}
                      onArchive={() => setArchiveTarget(a)}
                      onDelete={() => setDeleteTarget(a)}
                      onConvertToGold={() => setConvertTarget(a)}
                    />
                  ))}
                </div>
              )}
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          )}

          {/* Account transactions whose account was removed */}
          {unlinkedAccountTxs.length > 0 && (
            <Card className="flex flex-col">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-800/30">
                <Link2Off size={13} className="text-gray-400" />
                <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Unlinked Account Transactions</h2>
                <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">Account no longer active — mark as sold or remove</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {unlinkedAccountTxs.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3 group">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                      <User size={15} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{tx.description || 'Account'}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(tx.date)}</p>
                    </div>
                    <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <button onClick={() => setArchivePendingTarget(tx)} title="Mark as sold"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                        <Check size={13} />
                      </button>
                      <button onClick={() => setDeletePendingTarget(tx)} title="Remove"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="w-40 shrink-0">
                      <ProfitPhpBar tx={tx} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Gold trades tab ─────────────────────────────────────────── */}
      {tab === 'gold' && (
        pendingGoldTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
              <Coins className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No pending gold trades</p>
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Transaction</Button>
          </div>
        ) : (
          <Card className="flex flex-col">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 bg-amber-50/40 dark:bg-amber-900/10">
              <Coins size={13} className="text-amber-500 dark:text-amber-400" />
              <h2 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Pending Gold Trades</h2>
              <span className="ml-auto text-[11px] font-semibold text-amber-600 dark:text-amber-500">
                {goldAwaiting} awaiting · {pendingGoldTrades.length - goldAwaiting} confirmed
              </span>
            </div>

            <PendingGoldTotals trades={pendingGoldTrades} />

            <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
              {pendingGoldTrades.map((tx) => (
                <GoldTradeRow
                  key={tx.id}
                  tx={tx}
                  onEdit={() => openEditGold(tx)}
                  onSell={() => setSellTarget(tx)}
                  onAddGold={() => setAddGoldTarget(tx)}
                  totalReceived={tx.system_key === 'middleman_fee' ? mmFeesThisMonth : null}
                  onDelete={() => setDeletePendingTarget(tx)}
                />
              ))}
            </div>
          </Card>
        )
      )}

      {/* ── Sold tab ────────────────────────────────────────────────── */}
      {tab === 'sold' && soldKind === 'account' && (
        archiveLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />)}
          </div>
        ) : archivedAccounts.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-14 text-center text-sm text-gray-400 dark:text-gray-500">No sold accounts yet.</p>
        ) : (
          <SoldAccounts accounts={archivedAccounts} page={archivePage} onPageChange={setArchivePage} txByAccount={txByAccount} onRestore={setUnarchiveTarget} />
        )
      )}

      {tab === 'sold' && soldKind === 'gold' && (
        <Card className="flex flex-col">
          <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
            {archivedTxsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                  <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-2.5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>
              ))
            ) : archivedGoldTrades.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-gray-400 dark:text-gray-500">No sold gold trades yet.</p>
            ) : (
              <SoldGoldTrades trades={archivedGoldTrades} page={goldArchivePage} onPageChange={setGoldArchivePage} onRestore={(tx) => handleUnarchiveTx(tx.id)} />
            )}
          </div>
        </Card>
      )}

      <TypePickerModal open={showTypePicker} onClose={() => setShowTypePicker(false)} onPick={openAddKind} />

      <RucoyTransactionModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        kind={formKind}
        account={editingAccount}
        accountTx={editingAccountTx}
        goldTx={editingGold}
        onSubmitAccount={handleAccountSubmit}
        onSubmitGold={handleGoldSubmit}
      />

      {showTxModal && (
        <AllTransactionsModal onClose={() => setShowTxModal(false)} loading={bizTxLoading} transactions={allTxsSorted} onReclassify={setReclassifyTarget} />
      )}

      <ConfirmDialog open={!!archivePendingTarget} onClose={() => setArchivePendingTarget(null)} onConfirm={handleArchivePending} loading={archivingPending}
        title="Mark as Sold" message={`Mark "${archivePendingTarget?.description || 'this trade'}" as sold?`} confirmLabel="Mark as Sold" />

      <ConfirmDialog open={!!deletePendingTarget} onClose={() => setDeletePendingTarget(null)} onConfirm={handleDeletePending} loading={deletingPending}
        title="Remove Transaction" message={`Remove "${deletePendingTarget?.description || 'this transaction'}"? This cannot be undone.`} confirmLabel="Remove" />

      <ConfirmDialog open={!!reclassifyTarget} onClose={() => setReclassifyTarget(null)} onConfirm={handleReclassify} loading={reclassifying}
        title="Reclassify as Gold" confirmLabel="Mark as Gold"
        message={`Mark "${reclassifyTarget?.description || 'this transaction'}" as Gold instead of ${reclassifyTarget ? BIZ_TYPE_LABELS[reclassifyTarget.type as BusinessTransactionType] : ''}?`} />

      <ConfirmDialog open={!!archiveTarget} onClose={() => setArchiveTarget(null)} onConfirm={handleArchive} loading={archiving}
        title="Mark as Sold" message={`Mark "${archiveTarget?.description || archiveTarget?.email}" as sold? You can restore it anytime.`} confirmLabel="Mark as Sold" />

      <ConfirmDialog open={!!unarchiveTarget} onClose={() => setUnarchiveTarget(null)} onConfirm={handleUnarchive} loading={unarchiving}
        title="Restore Account" message={`Restore "${unarchiveTarget?.description || unarchiveTarget?.email}" back to active accounts?`} confirmLabel="Restore" />

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}
        title="Delete Account" message={`Delete "${deleteTarget?.description || deleteTarget?.email}" and its pricing transaction? This cannot be undone.`} confirmLabel="Delete" />

      {addGoldTarget && (
        <AddGoldModal
          target={addGoldTarget}
          onClose={() => setAddGoldTarget(null)}
          onAdded={(tx) => { refetchBizTxs(); if (tx.system_key === 'middleman_fee') refetchMmFees() }}
        />
      )}

      {sellTarget && (
        <SellGoldModal target={sellTarget} onClose={() => setSellTarget(null)} onSold={() => { refetchBizTxs(); afterSoldChange() }} />
      )}

      <ConfirmDialog open={!!convertTarget} onClose={() => setConvertTarget(null)} onConfirm={handleConvertToGold} loading={converting}
        title="Convert to Gold Trade" confirmLabel="Convert"
        message={`Move "${convertTarget?.description || convertTarget?.email}" to Pending Gold Trades? Its gold price, cost, rates and date carry over, and the account card is removed (the email is kept in the trade's notes).`} />
    </div>
  )
}

function SortIcon({ sort }: { sort: 'asc' | 'desc' | null }) {
  if (sort === 'desc') return <ArrowDown size={13} />
  if (sort === 'asc') return <ArrowUp size={13} />
  return <ArrowUpDown size={13} />
}

function SoldAccounts({ accounts, page, onPageChange, txByAccount, onRestore }: {
  accounts: RucoyAccount[]
  page: number
  onPageChange: (page: number) => void
  txByAccount: Map<number, BusinessTransaction>
  onRestore: (a: RucoyAccount) => void
}) {
  const { paginated, meta } = paginateLocally(accounts, page, 9)
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((a) => (
          <AccountCard key={a.id} a={a} tx={txByAccount.get(a.id)} archived onUnarchive={() => onRestore(a)} />
        ))}
      </div>
      <Pagination meta={meta} onPageChange={onPageChange} />
    </div>
  )
}

function SoldGoldTrades({ trades, page, onPageChange, onRestore }: {
  trades: BusinessTransaction[]
  page: number
  onPageChange: (page: number) => void
  onRestore: (tx: BusinessTransaction) => void
}) {
  const { paginated, meta } = paginateLocally(trades, page, 10)
  return (
    <>
      {paginated.map((tx) => (
        <GoldTradeRow key={tx.id} tx={tx} archived onUnarchive={() => onRestore(tx)} />
      ))}
      {meta.last_page > 1 && (
        <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700/40">
          <Pagination meta={meta} onPageChange={onPageChange} />
        </div>
      )}
    </>
  )
}
