import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Plus, Pencil, Trash2, Users, User, TrendingUp, TrendingDown, DollarSign, Search, Check, Archive, RotateCcw, Download, CalendarClock, Calendar, ArrowUp, ArrowDown, ArrowUpDown, Receipt, Coins, BarChart3, Link2Off, HandCoins, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pagination } from '@/components/ui/Pagination'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { RucoyTransactionModal, type AccountPricingPayload, type RucoyTxKind } from '@/components/modals/RucoyTransactionModal'
import { useRucoyAccounts } from '@/hooks/useRucoyAccounts'
import { useArchive } from '@/hooks/useArchive'
import { useBusinessTransactions } from '@/hooks/useBusinessTransactions'
import { Modal } from '@/components/ui/Modal'
import { rucoyAccountsApi, type AccountPayload } from '@/api/rucoy'
import { businessTransactionsApi, type BusinessSummary, type BusinessTransactionPayload } from '@/api/business'
import { toast } from '@/components/ui/Toast'
import { paginateLocally, formatCurrency, formatDate, formatWithCommas, handleAmountInput, todayISO, MONTHS } from '@/utils/format'
import { flattenApiErrors } from '@/utils/api'
import { exportCsv } from '@/utils/csv'
import { isBusinessIncome } from '@/utils/business'
import { Amt } from '@/context/AmountVisibilityContext'
import type { AccountPaymentStatus, BusinessTransaction, BusinessTransactionType, RucoyAccount } from '@/types'

const fmtGold = (n: number) => `${n.toLocaleString()} G`
const BIZ_TYPE_LABELS: Record<string, string> = { account: 'Account', gold: 'Gold', expense: 'Item' }
const BIZ_TYPE_COLORS: Record<string, string>  = { account: '#6366f1', gold: '#f59e0b', expense: '#ef4444' }

const PAYMENT_STATUS_STYLES: Record<AccountPaymentStatus, { label: string; className: string }> = {
  not_paid:       { label: 'Not Paid',       className: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  partially_paid: { label: 'Partially Paid', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  fully_paid:     { label: 'Fully Paid',     className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

/** PHP profit of a priced business transaction, or null while awaiting pricing. */
function txProfitPhp(tx: BusinessTransaction | null | undefined): number | null {
  if (!tx || tx.price_php == null || tx.cost_php == null) return null
  return tx.profit_php != null ? parseFloat(tx.profit_php) : parseFloat(tx.price_php) - parseFloat(tx.cost_php)
}

function ProfitPhpBar({ tx, dimmed = false, onSetPricing }: { tx: BusinessTransaction | null | undefined; dimmed?: boolean; onSetPricing?: () => void }) {
  const profit = txProfitPhp(tx)

  if (profit == null) {
    return (
      <button
        type="button"
        onClick={onSetPricing}
        disabled={!onSetPricing}
        className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 px-3 py-2 text-left enabled:hover:bg-amber-50 dark:enabled:hover:bg-amber-900/20 transition-colors"
      >
        <Coins size={12} className="text-amber-500 dark:text-amber-400 shrink-0" />
        <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Awaiting pricing</span>
        {onSetPricing && <span className="ml-auto text-[11px] font-semibold text-amber-600 dark:text-amber-400">Set rates →</span>}
      </button>
    )
  }

  const positive = profit >= 0
  return (
    <div className={[
      'flex items-center gap-1.5 rounded-lg px-3 py-2',
      dimmed ? 'bg-gray-100 dark:bg-gray-700/30' : positive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20',
    ].join(' ')}>
      {positive
        ? <TrendingUp size={12} className={dimmed ? 'text-gray-400' : 'text-emerald-600 dark:text-emerald-400 shrink-0'} />
        : <TrendingDown size={12} className={dimmed ? 'text-gray-400' : 'text-red-500 dark:text-red-400 shrink-0'} />
      }
      <span className="text-xs text-gray-500 dark:text-gray-400">Profit (₱)</span>
      <span className={['text-sm font-bold ml-auto', dimmed ? 'text-gray-500 dark:text-gray-400' : positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
        <Amt value={formatCurrency(profit)} />
      </span>
    </div>
  )
}

function AccountCard({ a, tx, onEdit, onArchive, onDelete, onConvertToGold, archived = false, onUnarchive }: {
  a: RucoyAccount
  tx?: BusinessTransaction | null
  onEdit?: () => void
  onArchive?: () => void
  onDelete?: () => void
  onConvertToGold?: () => void
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
                title="Mark as sold"
              >
                <Check size={13} />
              </button>
              <button
                onClick={onConvertToGold}
                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                title="Convert to gold trade"
              >
                <Coins size={13} />
              </button>
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                title="Edit"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats row (gold) */}
      {(a.price != null || a.cost != null || a.profit != null) && (
        <div className="mx-4 mb-2 grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 overflow-hidden">
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

      {/* Profit row (PHP, from the linked business transaction) */}
      <div className="mx-4 mb-3">
        <ProfitPhpBar tx={tx} dimmed={archived} onSetPricing={archived ? undefined : onEdit} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <span className={['inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', PAYMENT_STATUS_STYLES[a.payment_status].className].join(' ')}>
          {PAYMENT_STATUS_STYLES[a.payment_status].label}
        </span>
        {tx?.date && (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            <Calendar size={11} />
            {formatDate(tx.date)}
          </span>
        )}
        {!archived && a.payment_date && (() => {
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
            <span className={['ml-auto inline-flex items-center gap-1 text-[11px] font-semibold', color].join(' ')}>
              <CalendarClock size={11} />
              {label}
            </span>
          )
        })()}
      </div>
    </div>
  )
}

function HeroStat({ Icon, label, value, valueCls, sub }: {
  Icon: LucideIcon
  label: string
  value: ReactNode
  valueCls: string
  sub?: ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-3.5 w-3.5 text-slate-300" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className={['text-base font-bold truncate', valueCls].join(' ')}>{value}</p>
        {sub && <p className="text-[11px] font-medium text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  )
}

function GoldAmountLine({ label, total, done, doneLabel, color }: {
  label: string
  total: string | null
  done: string | null | undefined
  doneLabel: string
  color: string
}) {
  if (total == null) return null
  const totalNum = Number(total)
  const doneNum  = done != null ? Number(done) : null
  const pct      = doneNum != null && totalNum > 0 ? (doneNum / totalNum) * 100 : null
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={['text-xs font-semibold', color].join(' ')}>{label}: {totalNum.toLocaleString()} G</span>
      {pct != null && (
        <div className="flex items-center gap-1.5" title={`${doneLabel} ${doneNum!.toLocaleString()} of ${totalNum.toLocaleString()} G`}>
          <ProgressBar percent={pct} color="bg-amber-500" className="!w-20" />
          <span className={['text-[10px] font-semibold', pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'].join(' ')}>
            {pct >= 100 ? `${doneLabel} ✓` : `${Math.round(pct)}% ${doneLabel.toLowerCase()}`}
          </span>
        </div>
      )}
    </div>
  )
}

function GoldTradeRow({ tx, archived = false, onEdit, onSell, onDelete, onUnarchive }: {
  tx: BusinessTransaction
  archived?: boolean
  onEdit?: () => void
  onSell?: () => void
  onDelete?: () => void
  onUnarchive?: () => void
}) {
  const isPending = tx.price_php == null
  const profit    = txProfitPhp(tx)

  return (
    <div className={['flex items-center gap-3 px-5 py-3 group', archived ? 'opacity-75' : ''].join(' ')}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
        <Coins size={15} className="text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{tx.description || 'Gold Trade'}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(tx.date)}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {/* Buttons — hover only */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
          {archived ? (
            <button onClick={onUnarchive} title="Restore"
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              <RotateCcw size={13} />
            </button>
          ) : (
            <>
              <button onClick={onEdit} title="Edit"
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                <Pencil size={13} />
              </button>
              <button onClick={onDelete} title="Remove"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>

        {/* Gold price / cost, with received / paid progress */}
        <div className="hidden sm:flex flex-col items-end gap-1 text-right">
          <GoldAmountLine label="Price" total={tx.price_gold} done={tx.price_gold_received} doneLabel="Received" color="text-emerald-600 dark:text-emerald-400" />
          <GoldAmountLine label="Cost"  total={tx.cost_gold}  done={tx.cost_gold_paid}      doneLabel="Paid"     color="text-red-500 dark:text-red-400" />
        </div>

        {/* PHP profit / status */}
        <div className="flex flex-col items-end text-right min-w-[96px]">
          {profit != null ? (
            <span className={['text-sm font-bold', profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
              <Amt value={formatCurrency(profit)} />
            </span>
          ) : (
            <span className="text-sm font-bold text-gray-300 dark:text-gray-600">—</span>
          )}
          {!archived && (
            <span className={['text-[10px] font-medium mt-0.5', isPending ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'].join(' ')}>
              {isPending ? 'Awaiting pricing' : 'Confirmed'}
            </span>
          )}
        </div>

        {/* Sell — confirmed trades only */}
        {!archived && (
          <button
            onClick={onSell}
            disabled={isPending}
            title={isPending ? 'Set the rates before selling' : 'Sell all or part of this gold'}
            className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <HandCoins size={12} />
            Sell
          </button>
        )}
      </div>
    </div>
  )
}

const _now      = new Date()
const CUR_M     = _now.getMonth()
const CUR_Y     = _now.getFullYear()
const CUR_LABEL = `${MONTHS[CUR_M]} ${CUR_Y}`

export default function Accounts() {
  const { accounts, loading, error, create, update, archive, unarchive, remove } = useRucoyAccounts()

  const [search, setSearch]     = useState('')
  const [profitSort, setProfitSort] = useState<'asc' | 'desc' | null>(null)
  const [priceSort,  setPriceSort]  = useState<'asc' | 'desc' | null>(null)
  const [page, setPage]         = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<RucoyAccount | null>(null)
  const [deleting, setDeleting] = useState(false)
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

  const [showGoldArchive, setShowGoldArchive] = useState(false)
  const [archivePage, setArchivePage]         = useState(1)
  const [goldArchivePage, setGoldArchivePage] = useState(1)

  const [showTxModal, setShowTxModal] = useState(false)
  const [txPage, setTxPage]           = useState(1)

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

  // Unified add / edit modal
  const [formOpen, setFormOpen]       = useState(false)
  const [formKind, setFormKind]       = useState<RucoyTxKind>('account')
  const [editingAccount, setEditingAccount] = useState<RucoyAccount | null>(null)
  const [editingGold, setEditingGold] = useState<BusinessTransaction | null>(null)

  // Linked business transaction per account
  const txByAccount = useMemo(() => {
    const map = new Map<number, BusinessTransaction>()
    for (const tx of [...archivedTxs, ...bizTxs]) {
      if (tx.type === 'account' && tx.account_id != null) map.set(tx.account_id, tx)
    }
    return map
  }, [bizTxs, archivedTxs])

  const editingAccountTx = editingAccount ? txByAccount.get(editingAccount.id) ?? null : null

  const [showTypePicker, setShowTypePicker] = useState(false)

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
      await createBizTx(data)
      toast.success('Gold trade added.')
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
        price_rate:    tx.price_rate    != null ? Number(tx.price_rate)    : null,
        cost_rate:     tx.cost_rate     != null ? Number(tx.cost_rate)     : null,
        php_rate:      tx.php_rate      != null ? Number(tx.php_rate)      : null,
        cost_php_rate: tx.cost_php_rate != null ? Number(tx.cost_php_rate) : null,
        price_php:     tx.price_php     != null ? Number(tx.price_php)     : null,
        cost_php:      tx.cost_php      != null ? Number(tx.cost_php)      : null,
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
      toast.error((err as { message: string }).message)
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
    const toNum = (v: string | null | undefined) => (v != null ? Number(v) : null)
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

  // Sell all or part of a confirmed gold trade
  const [sellTarget, setSellTarget]   = useState<BusinessTransaction | null>(null)
  const [sellAmount, setSellAmount]   = useState('')
  const [sellDeduct, setSellDeduct]   = useState(true)
  const [sellError, setSellError]     = useState<string | null>(null)
  const [selling, setSelling]         = useState(false)

  const openSell = (tx: BusinessTransaction) => {
    setSellTarget(tx)
    setSellAmount(tx.price_gold != null ? String(Number(tx.price_gold)) : '')
    setSellDeduct(true)
    setSellError(null)
  }

  const sellTotal    = sellTarget?.price_gold != null ? Number(sellTarget.price_gold) : 0
  const sellNum      = parseFloat(sellAmount) || 0
  const sellFraction = sellTotal > 0 ? Math.min(sellNum / sellTotal, 1) : 0
  const sellPreview  = sellTarget && {
    pricePhp:  Number(sellTarget.price_php ?? 0) * sellFraction,
    costPhp:   Number(sellTarget.cost_php ?? 0) * sellFraction,
    costGold:  Math.round(Number(sellTarget.cost_gold ?? 0) * sellFraction),
    remaining: Math.max(sellTotal - sellNum, 0),
  }

  const handleSell = async () => {
    if (!sellTarget) return
    if (sellNum <= 0) { setSellError('Enter how much gold to sell.'); return }
    if (sellNum > sellTotal) { setSellError(`You can sell at most ${sellTotal.toLocaleString()} G.`); return }
    setSelling(true)
    try {
      const { remaining } = await businessTransactionsApi.sell(sellTarget.id, sellNum, sellDeduct)
      refetchBizTxs()
      afterSoldChange()
      toast.success(remaining
        ? `Sold ${sellNum.toLocaleString()} G — ${remaining.price_gold != null ? Number(remaining.price_gold).toLocaleString() : 0} G still pending.`
        : `Sold all ${sellNum.toLocaleString()} G.`)
      setSellTarget(null)
    } catch (err: unknown) {
      const flat = flattenApiErrors(err)
      setSellError(flat?.amount ?? (err as { message?: string }).message ?? 'Failed to sell gold.')
    } finally {
      setSelling(false)
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

  const { paginated, meta } = paginateLocally(filteredAccounts, page, 9)

  const pendingGoldTrades = useMemo(() =>
    bizTxs.filter(tx => tx.type === 'gold' && tx.archived_at == null),
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
  const totals = useMemo(() => {
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

  const monthPositive = (summary?.profit ?? 0) >= 0

  return (
    <div className="flex flex-col gap-5">

      {error && <div className="text-red-500 text-sm text-center py-2">{error}</div>}

      {/* Hero banner — left: realized ₱ profit this month · right: listed accounts in G */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />
        <div className="absolute -bottom-16 left-1/2 h-40 w-40 rounded-full bg-indigo-400/[0.04]" />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 lg:divide-x divide-white/10">

          {/* Sold this month */}
          <section className="flex flex-col gap-4 lg:pr-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-400/20">
                  <BarChart3 className="h-3.5 w-3.5 text-teal-400" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sold Profit</span>
                <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">{CUR_LABEL}</span>
              </div>
              <p className={['text-3xl font-bold', monthPositive ? 'text-teal-300' : 'text-red-400'].join(' ')}>
                <Amt value={formatCurrency(summary?.profit ?? 0)} />
              </p>
              <p className="mt-1 text-xs text-slate-500">Accounts &amp; golds marked as sold this month</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <HeroStat Icon={TrendingUp} label="Income" value={<Amt value={formatCurrency(summary?.income ?? 0)} />} valueCls="text-emerald-400" />
              <HeroStat Icon={TrendingDown} label="Cost" value={<Amt value={formatCurrency(summary?.expense ?? 0)} />} valueCls="text-red-400" />
            </div>
          </section>

          {/* Listed (unsold) accounts */}
          <section className="flex flex-col gap-4 pt-6 border-t border-white/10 lg:pt-0 lg:border-t-0 lg:pl-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-400/20">
                  <Users className="h-3.5 w-3.5 text-indigo-300" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Listed Profit</span>
                <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">
                  {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className={['text-3xl font-bold', totals.profit >= 0 ? 'text-emerald-300' : 'text-red-400'].join(' ')}>
                {fmtGold(totals.profit)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                ≈ <span className="font-semibold text-slate-300"><Amt value={formatCurrency(totals.profitPhp)} /></span> at the rates you've set
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <HeroStat Icon={DollarSign} label="Total Price" value={fmtGold(totals.price)} valueCls="text-indigo-300"
                sub={<Amt value={formatCurrency(totals.pricePhp)} />} />
              <HeroStat Icon={TrendingDown} label="Total Cost" value={fmtGold(totals.cost)} valueCls="text-slate-200"
                sub={<Amt value={formatCurrency(totals.costPhp)} />} />
            </div>
          </section>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Search */}
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

        {/* Sort group — hidden on mobile */}
        <div className="hidden md:flex items-center divide-x divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          <button
            onClick={() => { setPriceSort(null); setProfitSort((s) => s === null ? 'desc' : s === 'desc' ? 'asc' : null); setPage(1) }}
            className={['flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors', profitSort ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'].join(' ')}
          >
            {profitSort === 'desc' ? <ArrowDown size={13} /> : profitSort === 'asc' ? <ArrowUp size={13} /> : <ArrowUpDown size={13} />}
            Profit
          </button>
          <button
            onClick={() => { setProfitSort(null); setPriceSort((s) => s === null ? 'desc' : s === 'desc' ? 'asc' : null); setPage(1) }}
            className={['flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors', priceSort ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'].join(' ')}
          >
            {priceSort === 'desc' ? <ArrowDown size={13} /> : priceSort === 'asc' ? <ArrowUp size={13} /> : <ArrowUpDown size={13} />}
            Price
          </button>
        </div>

        {/* Archive toggles group — hidden on mobile */}
        <div className="hidden md:flex items-center divide-x divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          <button
            onClick={() => setShowArchive((v) => !v)}
            title="Sold Accounts"
            className={['flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors', showArchive ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'].join(' ')}
          >
            <Archive size={13} />
            Sold Accounts
            {archivedAccounts.length > 0 && showArchive && (
              <span className="rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-[10px] font-bold px-1.5">
                {archivedAccounts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowGoldArchive((v) => !v)}
            title="Sold Golds"
            className={['flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors', showGoldArchive ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'].join(' ')}
          >
            <Coins size={13} />
            Sold Golds
            {archivedGoldTrades.length > 0 && showGoldArchive && (
              <span className="rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-[10px] font-bold px-1.5">
                {archivedGoldTrades.length}
              </span>
            )}
          </button>
        </div>

        {/* Utility actions — hidden on mobile */}
        <div className="hidden md:flex items-center divide-x divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          <button
            onClick={() => { setShowTxModal(true); setTxPage(1) }}
            title="All Transactions"
            className="flex items-center px-2.5 py-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <Receipt size={14} />
          </button>
          <button
            onClick={handleExport}
            title="Export CSV"
            className="flex items-center px-2.5 py-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <Download size={14} />
          </button>
        </div>

        {/* Primary CTA */}
        <div className="ml-auto">
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openAdd}>Add Transaction</Button>
        </div>
      </div>

      {/* Skeleton loading */}
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
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Transaction</Button>
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

      {/* Pending Gold Trades section */}
      {pendingGoldTrades.length > 0 && (
        <Card className="flex flex-col">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 bg-amber-50/40 dark:bg-amber-900/10">
            <Coins size={13} className="text-amber-500 dark:text-amber-400" />
            <h2 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Pending Gold Trades</h2>
            <span className="ml-auto text-[11px] font-semibold text-amber-600 dark:text-amber-500">
              {pendingGoldTrades.filter(tx => tx.price_php == null).length} awaiting · {pendingGoldTrades.filter(tx => tx.price_php != null).length} confirmed
            </span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
            {pendingGoldTrades.map((tx) => (
              <GoldTradeRow
                key={tx.id}
                tx={tx}
                onEdit={() => openEditGold(tx)}
                onSell={() => openSell(tx)}
                onDelete={() => setDeletePendingTarget(tx)}
              />
            ))}
          </div>
        </Card>
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
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
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

      {/* Archive section */}
      {showArchive && (
        <Card className="flex flex-col">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 bg-amber-50/40 dark:bg-amber-900/10">
            <Archive size={13} className="text-amber-500 dark:text-amber-400" />
            <h2 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Sold Accounts</h2>
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
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No sold accounts.</p>
            ) : (() => {
              const { paginated: archPaged, meta: archMeta } = paginateLocally(archivedAccounts, archivePage, 6)
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {archPaged.map((a) => (
                      <AccountCard
                        key={a.id}
                        a={a}
                        tx={txByAccount.get(a.id)}
                        archived
                        onUnarchive={() => setUnarchiveTarget(a)}
                      />
                    ))}
                  </div>
                  <div className="mt-4">
                    <Pagination meta={archMeta} onPageChange={setArchivePage} />
                  </div>
                </>
              )
            })()}
          </div>
        </Card>
      )}

      {/* Archived Gold section */}
      {showGoldArchive && (
        <Card className="flex flex-col">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 bg-amber-50/40 dark:bg-amber-900/10">
            <Coins size={13} className="text-amber-500 dark:text-amber-400" />
            <h2 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Sold Golds</h2>
            {archivedGoldTrades.length > 0 && (
              <span className="ml-auto text-[11px] font-semibold text-amber-600 dark:text-amber-500">
                {archivedGoldTrades.length} total
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
            {archivedTxsLoading ? (
              <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                    <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="h-2.5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : archivedGoldTrades.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">No sold gold trades.</p>
            ) : (() => {
              const { paginated: goldPaged, meta: goldMeta } = paginateLocally(archivedGoldTrades, goldArchivePage, 5)
              return (
                <>
                  {goldPaged.map((tx) => (
                    <GoldTradeRow key={tx.id} tx={tx} archived onUnarchive={() => handleUnarchiveTx(tx.id)} />
                  ))}
                  {goldMeta.last_page > 1 && (
                    <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700/40">
                      <Pagination meta={goldMeta} onPageChange={setGoldArchivePage} />
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </Card>
      )}

      {/* Type picker modal */}
      <Modal open={showTypePicker} onClose={() => setShowTypePicker(false)} title="Add Transaction" size="sm">
        <div className="flex flex-col gap-3">
          <button
            onClick={() => openAddKind('account')}
            className="flex items-center gap-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-900/10 px-5 py-4 text-left hover:bg-indigo-100/60 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
              <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Account</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Track an account sale with gold pricing</p>
            </div>
          </button>
          <button
            onClick={() => openAddKind('gold')}
            className="flex items-center gap-4 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 px-5 py-4 text-left hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
              <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Gold</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Record a gold sale with gold and PHP pricing</p>
            </div>
          </button>
        </div>
      </Modal>

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

      {/* All transactions modal */}
      <Modal open={showTxModal} onClose={() => setShowTxModal(false)} title="All Transactions" size="xl">
        {(() => {
          const { paginated: txPaged, meta: txMeta } = paginateLocally(allTxsSorted, txPage, 10)
          return (
            <div className="flex flex-col gap-0 -mx-6 -my-5">
              {bizTxLoading ? (
                <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-6 py-3.5 animate-pulse">
                      <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                        <div className="h-2.5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                      </div>
                      <div className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  ))}
                </div>
              ) : allTxsSorted.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">No transactions yet.</p>
              ) : (
                <>
                  <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
                    {txPaged.map((tx) => {
                      const isIncome = isBusinessIncome(tx)
                      const isSold   = tx.archived_at != null
                      const color    = BIZ_TYPE_COLORS[tx.type] ?? '#14b8a6'
                      return (
                        <div key={tx.id} className={['group flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors', isSold ? 'opacity-60' : ''].join(' ')}>
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm"
                            style={{ backgroundColor: color }}
                          >
                            {BIZ_TYPE_LABELS[tx.type]?.charAt(0) ?? '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                              {tx.description || BIZ_TYPE_LABELS[tx.type]}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {formatDate(tx.date)}{isSold && ' · Sold'}
                            </p>
                          </div>
                          {!isSold && tx.type !== 'gold' && (
                            <button
                              onClick={() => setReclassifyTarget(tx)}
                              title="Mark as Gold"
                              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 transition-all dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40"
                            >
                              <Coins size={11} />
                              Gold
                            </button>
                          )}
                          <div className="flex flex-col items-end shrink-0">
                            <span className={['text-sm font-bold', isIncome ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                              {isIncome ? '+' : '−'}<Amt value={formatCurrency(tx.amount)} />
                            </span>
                            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">
                              {BIZ_TYPE_LABELS[tx.type]}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="px-6 py-3 border-t border-gray-50 dark:border-gray-700/40">
                    <Pagination meta={txMeta} onPageChange={setTxPage} />
                  </div>
                </>
              )}
            </div>
          )
        })()}
      </Modal>

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

      {/* Sell gold modal */}
      <Modal open={!!sellTarget} onClose={() => setSellTarget(null)} title="Sell Gold" size="md">
        {sellTarget && sellPreview && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                <Coins size={15} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{sellTarget.description || 'Gold Trade'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Available: {sellTotal.toLocaleString()} G</p>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount to sell (G)</p>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">{Math.round(sellFraction * 100)}% of trade</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={formatWithCommas(sellAmount)}
                  onChange={(e) => { handleAmountInput(e.target.value, setSellAmount); setSellError(null) }}
                  className={['block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 transition-colors', sellError ? 'border-red-400 dark:border-red-500' : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'].join(' ')}
                />
                {[50, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => { setSellAmount(String(Math.round(sellTotal * pct / 100))); setSellError(null) }}
                    className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-600 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {pct === 100 ? 'All' : `${pct}%`}
                  </button>
                ))}
              </div>
              {sellError && <p className="mt-1 text-xs text-red-500">{sellError}</p>}
            </div>

            {/* Preview of the split */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Sold now</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Price <span className="font-semibold text-gray-700 dark:text-gray-200"><Amt value={formatCurrency(sellPreview.pricePhp)} /></span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cost <span className="font-semibold text-gray-700 dark:text-gray-200"><Amt value={formatCurrency(sellPreview.costPhp)} /></span> · {sellPreview.costGold.toLocaleString()} G</p>
                <p className={['mt-1 text-sm font-bold', sellPreview.pricePhp - sellPreview.costPhp >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                  <Amt value={formatCurrency(sellPreview.pricePhp - sellPreview.costPhp)} /> profit
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Stays pending</p>
                <p className="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{sellPreview.remaining.toLocaleString()} G</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {sellPreview.remaining > 0 ? 'Keeps the same rates' : 'Whole trade moves to Sold Golds'}
                </p>
              </div>
            </div>

            <label className="flex items-start gap-2.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              <input
                type="checkbox"
                checked={sellDeduct}
                onChange={(e) => setSellDeduct(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">Deduct from Golds inventory</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500">Removes {sellNum.toLocaleString()} G from Rucoy → Golds and logs the sale</span>
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="secondary" onClick={() => setSellTarget(null)} disabled={selling}>Cancel</Button>
              <Button onClick={handleSell} loading={selling} icon={<HandCoins className="h-4 w-4" />}>
                {sellNum >= sellTotal ? 'Sell All' : `Sell ${sellNum.toLocaleString()} G`}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!convertTarget} onClose={() => setConvertTarget(null)} onConfirm={handleConvertToGold} loading={converting}
        title="Convert to Gold Trade" confirmLabel="Convert"
        message={`Move "${convertTarget?.description || convertTarget?.email}" to Pending Gold Trades? Its gold price, cost, rates and date carry over, and the account card is removed (the email is kept in the trade's notes).`} />
    </div>
  )
}
