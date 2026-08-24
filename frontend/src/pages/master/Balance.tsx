import { useMemo, useState } from 'react'
import { DollarSign, Minus, Pencil, Plus, SlidersHorizontal, Trash2, Wallet } from 'lucide-react'

import { useBalanceEntries } from '@/hooks/useBalanceEntries'
import { BalanceModal } from '@/components/modals/BalanceModal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/Toast'
import { formatDate } from '@/utils/format'
import { Amt } from '@/context/AmountVisibilityContext'
import type { BalanceAccount, BalanceEntry, BalanceEntryType } from '@/types'
import type { BalanceEntryPayload } from '@/api/master'

const PHP_RATE_KEY = 'balance_php_rate'

function getSavedRate(): number {
  const v = localStorage.getItem(PHP_RATE_KEY)
  return v ? parseFloat(v) || 58 : 58
}

function calcBalance(entries: BalanceEntry[], account: BalanceAccount): number {
  return entries
    .filter((e) => e.account === account)
    .reduce((sum, e) => {
      const amt = parseFloat(e.amount)
      return e.type === 'add' ? sum + amt : sum - amt
    }, 0)
}

const fmtUsd = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtPhp = (n: number) => `₱${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const PHP_ACCOUNTS: BalanceAccount[] = ['MARIBANK', 'MAYA', 'BANKO']
const isPhpAccount = (acc: BalanceAccount) => PHP_ACCOUNTS.includes(acc)

const ACCOUNT_LABELS: Record<BalanceAccount, string> = {
  PAYPAL: 'PayPal', BINANCE: 'Binance', MEXC: 'MEXC', MARIBANK: 'Maribank', MAYA: 'Maya', BANKO: 'BanKo',
}

const ACCOUNT_BADGE: Record<BalanceAccount, string> = {
  PAYPAL:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  BINANCE:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  MEXC:     'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  MARIBANK: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MAYA:     'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  BANKO:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

const PER_PAGE = 5

export default function Balance() {
  const { entries, loading, create, update, remove } = useBalanceEntries()

  const [phpRate,    setPhpRate]    = useState(getSavedRate)
  const [phpInput,   setPhpInput]   = useState(() => String(getSavedRate()))

  const [modalOpen,    setModalOpen]    = useState(false)
  const [editTarget,   setEditTarget]   = useState<BalanceEntry | null>(null)
  const [defaultAcc,   setDefaultAcc]   = useState<BalanceAccount>('PAYPAL')
  const [defaultType,  setDefaultType]  = useState<BalanceEntryType>('add')
  const [deleteTarget, setDeleteTarget] = useState<BalanceEntry | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [page, setPage] = useState(1)

  const paypalBalance   = useMemo(() => calcBalance(entries, 'PAYPAL'),   [entries])
  const binanceBalance  = useMemo(() => calcBalance(entries, 'BINANCE'),  [entries])
  const mexcBalance     = useMemo(() => calcBalance(entries, 'MEXC'),     [entries])
  const maribankBalance = useMemo(() => calcBalance(entries, 'MARIBANK'), [entries])
  const mayaBalance     = useMemo(() => calcBalance(entries, 'MAYA'),     [entries])
  const bankoBalance    = useMemo(() => calcBalance(entries, 'BANKO'),    [entries])

  const totalUSD = paypalBalance + binanceBalance + mexcBalance
  const totalPHP = maribankBalance + mayaBalance + bankoBalance

  const totalPages = Math.max(1, Math.ceil(entries.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = entries.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const meta = {
    current_page: safePage,
    last_page:    totalPages,
    from:         entries.length ? (safePage - 1) * PER_PAGE + 1 : null,
    to:           Math.min(safePage * PER_PAGE, entries.length) || null,
    total:        entries.length,
    per_page:     PER_PAGE,
  }

  const openAdd = (account: BalanceAccount, type: BalanceEntryType) => {
    setEditTarget(null)
    setDefaultAcc(account)
    setDefaultType(type)
    setModalOpen(true)
  }

  const openEdit = (e: BalanceEntry) => {
    setEditTarget(e)
    setModalOpen(true)
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
      localStorage.setItem(PHP_RATE_KEY, String(n))
    }
  }

  // Reusable account card
  const AccountCard = ({
    account, balance, headerClass, iconClass, icon, valueClass,
  }: {
    account: BalanceAccount
    balance: number
    headerClass: string
    iconClass: string
    icon: React.ReactNode
    valueClass: string
  }) => {
    const isPhp = isPhpAccount(account)
    return (
      <Card className="flex flex-col overflow-hidden">
        <div className={`flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 ${headerClass}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{ACCOUNT_LABELS[account]}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{isPhp ? 'PHP Balance' : 'USD Balance'}</p>
          </div>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div>
            <p className={`text-2xl font-bold ${valueClass}`}>
              <Amt value={isPhp ? fmtPhp(balance) : fmtUsd(balance)} />
            </p>
            {!isPhp && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                <Amt value={fmtPhp(balance * phpRate)} /> PHP
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openAdd(account, 'add')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-3 py-2 text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus size={13} /> Add
            </button>
            <button
              onClick={() => openAdd(account, 'sell')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-3 py-2 text-xs font-semibold transition-colors shadow-sm"
            >
              <Minus size={13} /> Sell
            </button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

        <div className="relative flex flex-col gap-4">
          {/* Two totals row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400/20">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">USD Balance</span>
              </div>
              <p className="text-3xl font-bold text-emerald-300">
                <Amt value={fmtUsd(totalUSD)} />
              </p>
              <p className="text-xs text-slate-500 mt-1">
                <Amt value={fmtPhp(totalUSD * phpRate)} /> PHP · PayPal + Binance + MEXC
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-400/20">
                  <Wallet className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">PHP Balance</span>
              </div>
              <p className="text-3xl font-bold text-violet-300">
                <Amt value={fmtPhp(totalPHP)} />
              </p>
              <p className="text-xs text-slate-500 mt-1">Maribank + Maya + BanKo</p>
            </div>
          </div>

          {/* Sub-stats breakdown */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-3 border-t border-white/10">
            {([
              { acc: 'PAYPAL',   bal: paypalBalance,   color: 'text-blue-300'   },
              { acc: 'BINANCE',  bal: binanceBalance,  color: 'text-yellow-300' },
              { acc: 'MEXC',     bal: mexcBalance,     color: 'text-cyan-300'   },
              { acc: 'MARIBANK', bal: maribankBalance, color: 'text-green-300'  },
              { acc: 'MAYA',     bal: mayaBalance,     color: 'text-violet-300' },
              { acc: 'BANKO',    bal: bankoBalance,    color: 'text-orange-300' },
            ] as const).map(({ acc, bal, color }) => (
              <div key={acc} className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 shrink-0">
                  <DollarSign className="h-3.5 w-3.5 text-slate-300" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{ACCOUNT_LABELS[acc]}</p>
                  <p className={`text-sm font-bold ${color}`}>
                    <Amt value={isPhpAccount(acc) ? fmtPhp(bal) : fmtUsd(bal)} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AccountCard
          account="PAYPAL"
          balance={paypalBalance}
          headerClass="bg-blue-50/60 dark:bg-blue-900/10"
          iconClass="bg-blue-100 dark:bg-blue-900/40"
          icon={<Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          valueClass="text-blue-700 dark:text-blue-400"
        />
        <AccountCard
          account="BINANCE"
          balance={binanceBalance}
          headerClass="bg-yellow-50/60 dark:bg-yellow-900/10"
          iconClass="bg-yellow-100 dark:bg-yellow-900/40"
          icon={<DollarSign className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
          valueClass="text-yellow-700 dark:text-yellow-400"
        />
        <AccountCard
          account="MEXC"
          balance={mexcBalance}
          headerClass="bg-cyan-50/60 dark:bg-cyan-900/10"
          iconClass="bg-cyan-100 dark:bg-cyan-900/40"
          icon={<DollarSign className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
          valueClass="text-cyan-700 dark:text-cyan-400"
        />
        <AccountCard
          account="MARIBANK"
          balance={maribankBalance}
          headerClass="bg-green-50/60 dark:bg-green-900/10"
          iconClass="bg-green-100 dark:bg-green-900/40"
          icon={<Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />}
          valueClass="text-green-700 dark:text-green-400"
        />
        <AccountCard
          account="MAYA"
          balance={mayaBalance}
          headerClass="bg-violet-50/60 dark:bg-violet-900/10"
          iconClass="bg-violet-100 dark:bg-violet-900/40"
          icon={<Wallet className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
          valueClass="text-violet-700 dark:text-violet-400"
        />
        <AccountCard
          account="BANKO"
          balance={bankoBalance}
          headerClass="bg-orange-50/60 dark:bg-orange-900/10"
          iconClass="bg-orange-100 dark:bg-orange-900/40"
          icon={<Wallet className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
          valueClass="text-orange-700 dark:text-orange-400"
        />
      </div>

      {/* Exchange rate */}
      <Card className="flex flex-wrap items-center gap-4 px-5 py-3.5">
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Exchange Rate</span>
        </div>
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700/60" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">1 USD =</span>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₱</span>
            <input
              type="number" min="0.01" step="0.01" value={phpInput}
              onChange={(e) => handlePhpRate(e.target.value)}
              className="w-24 rounded-lg border border-gray-200 bg-gray-50 pl-6 pr-2 py-1.5 text-xs text-gray-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <span className="text-xs text-gray-400">PHP</span>
        </div>
      </Card>

      {/* Transaction history */}
      <Card>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Transaction History</p>
          <span className="ml-auto rounded-full bg-gray-100 dark:bg-gray-700/60 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {entries.length}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-5 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-5 w-12 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 h-3 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <DollarSign className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No transactions yet.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Use the Add or Sell buttons on each account card.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Account</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Description</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Amount</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {paginated.map((e) => {
                  const isPhp = isPhpAccount(e.account)
                  const fmt = isPhp ? fmtPhp : fmtUsd
                  return (
                    <tr key={e.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">{formatDate(e.date)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ACCOUNT_BADGE[e.account]}`}>
                          {ACCOUNT_LABELS[e.account]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={e.type === 'add' ? 'income' : 'expense'}>
                          {e.type === 'add' ? 'Add' : 'Sell'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 max-w-xs truncate text-xs">
                        {e.description ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className={['px-5 py-3.5 text-right font-bold whitespace-nowrap', e.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                        {e.type === 'add' ? '+' : '−'}<Amt value={fmt(parseFloat(e.amount))} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(e)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(e)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700/40">
                <Pagination meta={meta} onPageChange={setPage} />
              </div>
            )}
          </div>
        )}
      </Card>

      <BalanceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        entry={editTarget}
        defaultAccount={defaultAcc}
        defaultType={defaultType}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Entry"
        message={`Delete this ${deleteTarget?.type} of ${
          deleteTarget ? (isPhpAccount(deleteTarget.account) ? fmtPhp : fmtUsd)(parseFloat(deleteTarget.amount)) : ''
        }? This cannot be undone.`}
      />
    </div>
  )
}
