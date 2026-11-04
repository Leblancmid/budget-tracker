import { useMemo, useState } from 'react'
import { Coins, Trash2, Wallet } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { accountPaymentsApi } from '@/api/rucoy'
import { readNumber, STORAGE_KEYS } from '@/lib/storage'
import { toast } from '@/lib/toast'
import { flattenApiErrors, errorMessage } from '@/utils/api'
import { blendedPhpPerMillion, tradeShareCostPhp } from '@/utils/accountCost'
import { formatWithCommas, handleAmountInput, todayManila } from '@/utils/format'
import { usableGold } from '@/utils/goldTrade'
import { TradePicker } from './TradePicker'
import type { AccountPayment, AccountPaymentMethod, BalanceAccountConfig, BusinessTransaction, RucoyAccount } from '@/types'

const php = (n: number) => `₱${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const g = (n: number) => `${n.toLocaleString()} G`

/** Short sentence for what a payment was. */
function describePayment(p: AccountPayment): string {
  if (p.method === 'cash') {
    const amount = p.currency === 'PHP' ? php(p.cash_amount ?? 0) : `${p.currency} ${(p.cash_amount ?? 0).toLocaleString()}`
    return `Cash · ${p.balance_account} ${amount}${p.cost_php_rate ? ` × ${p.cost_php_rate}` : ''}`
  }
  const name = p.taken?.trade?.description || 'Gold trade'
  return `Gold · ${name}${p.cost_rate ? ` @ ${p.cost_rate} × ${p.cost_php_rate}` : ''}`
}

/**
 * Pay toward an account's cost bit by bit: gold from any pending gold trade (its exact rates
 * carry over and the trade shrinks) or cash from a Balance wallet (deducted from it).
 */
export function AccountPaymentsModal({ open, onClose, account, goldTrades, wallets, onChanged }: {
  open: boolean
  onClose: () => void
  account: RucoyAccount | null
  /** Pending gold trades that can pay */
  goldTrades: BusinessTransaction[]
  wallets: BalanceAccountConfig[]
  /** Reload accounts, trades and the stash after a change */
  onChanged: () => Promise<unknown> | void
}) {
  const [method, setMethod]       = useState<AccountPaymentMethod>('gold_trade')
  const [tradeId, setTradeId]     = useState('')
  const [wallet, setWallet]       = useState('')
  const [gold, setGold]           = useState('')
  const [cash, setCash]           = useState('')
  const [phpRate, setPhpRate]     = useState(() => String(readNumber(STORAGE_KEYS.balancePhpRate, 58)))
  const [date, setDate]           = useState(todayManila)
  const [note, setNote]           = useState('')
  const [errors, setErrors]       = useState<Partial<Record<string, string>>>({})
  const [saving, setSaving]       = useState(false)
  const [removing, setRemoving]   = useState<AccountPayment | null>(null)
  const [removeBusy, setRemoveBusy] = useState(false)

  // Start fresh each time it opens for an account (reset during render, not in an effect)
  const [openedFor, setOpenedFor] = useState<number | null>(null)
  const current = open ? account?.id ?? null : null
  if (current !== openedFor) {
    setOpenedFor(current)
    setTradeId(''); setWallet(''); setGold(''); setCash(''); setNote(''); setErrors({}); setDate(todayManila())
  }

  const payments = account?.payments ?? []
  const costGold = account?.cost ?? null
  const paid     = { gold: account?.paid_gold ?? 0, php: account?.paid_cost_php ?? 0 }
  const left     = costGold != null ? Math.max(0, costGold - paid.gold) : null
  const pct      = costGold ? (paid.gold / costGold) * 100 : 0
  const blended  = blendedPhpPerMillion(paid)

  const trades = useMemo(
    () => goldTrades.filter((t) => t.type === 'gold' && !t.archived_at && Number(t.price_gold) > 0),
    [goldTrades],
  )
  const trade = trades.find((t) => String(t.id) === tradeId) ?? null
  // Only gold already received can pay (a buyer may still owe part of a trade)
  const tradeGold = trade ? usableGold(trade) : 0
  const walletCfg = wallets.find((w) => w.code === wallet) ?? null
  const goldNum = gold !== '' ? Number(gold) : null

  const previewPhp = method === 'gold_trade'
    ? (trade && goldNum ? tradeShareCostPhp({ price_gold: Number(trade.price_gold), cost_gold: Number(trade.cost_gold), cost_php: trade.cost_php != null ? Number(trade.cost_php) : null }, goldNum) : null)
    : (cash !== '' && walletCfg ? Number(cash) * (walletCfg.currency === 'PHP' ? 1 : Number(phpRate) || 0) : null)

  const maxGold = method === 'gold_trade' && trade
    ? (left != null ? Math.min(tradeGold, left) : tradeGold)
    : left

  const validate = () => {
    const e: typeof errors = {}
    if (!goldNum || goldNum <= 0) e.gold = 'Enter the gold this payment covers.'
    else if (left != null && goldNum > left) e.gold = `Only ${g(left)} is left to pay.`
    if (method === 'gold_trade') {
      if (!trade) e.source_trade_id = 'Pick a gold trade.'
      else if (goldNum && goldNum > tradeGold) e.gold = tradeGold < Number(trade.price_gold)
        ? `Only ${g(tradeGold)} of that trade has been received so far.`
        : `That trade only has ${g(tradeGold)}.`
      else if (trade.cost_php == null) e.source_trade_id = 'This trade has no cost rates yet. Add them in Edit Gold first.'
    } else {
      if (!walletCfg) e.balance_account = 'Pick a wallet.'
      if (!(Number(cash) > 0)) e.cash_amount = 'Enter the amount paid.'
      if (walletCfg && walletCfg.currency !== 'PHP' && !(Number(phpRate) > 0)) e.php_rate = 'Enter the ₱ rate.'
    }
    if (!date) e.date = 'Pick a date.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!account || !validate()) return
    setSaving(true)
    try {
      await accountPaymentsApi.create(account.id, {
        method,
        gold: goldNum!,
        date,
        note: note.trim() || null,
        ...(method === 'gold_trade'
          ? { source_trade_id: trade!.id }
          : { balance_account: wallet, cash_amount: Number(cash), php_rate: walletCfg?.currency === 'PHP' ? null : Number(phpRate) }),
      })
      toast.success(`Payment added: ${g(goldNum!)}.`)
      setGold(''); setCash(''); setNote(''); setTradeId(''); setErrors({})
      await onChanged()
    } catch (err) {
      const flat = flattenApiErrors(err)
      if (flat) setErrors(flat)
      else toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const confirmRemove = async () => {
    if (!account || !removing) return
    setRemoveBusy(true)
    try {
      await accountPaymentsApi.delete(account.id, removing.id)
      toast.success(removing.method === 'cash' ? 'Payment removed. The cash is back in the wallet.' : 'Payment removed. The gold is back in its trade and your stash.')
      setRemoving(null)
      await onChanged()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setRemoveBusy(false)
    }
  }

  const tabCls = (on: boolean) => [
    'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
    on ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
  ].join(' ')

  return (
    <>
      <Modal open={open} onClose={onClose} title={`Payments · ${account?.description || account?.email || ''}`} size={left !== 0 ? '6xl' : '2xl'}>
        {/* Wide screens: what's paid on the left, adding a payment on the right (no scrolling) */}
        <div className={left !== 0 ? 'grid grid-cols-1 gap-5 lg:grid-cols-[2fr_3fr]' : 'flex flex-col gap-5'}>
        <div className="flex flex-col gap-5">

          {/* Paid so far */}
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Paid <span className="font-semibold text-gray-900 dark:text-gray-100">{g(paid.gold)}</span>
                {costGold != null && <> of {g(costGold)}</>}
              </p>
              {left != null && (
                <p className={['text-sm font-semibold', left === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'].join(' ')}>
                  {left === 0 ? 'Fully paid' : `${g(left)} left`}
                </p>
              )}
            </div>
            {costGold != null && <ProgressBar percent={pct} color="bg-amber-500" className="mt-2" />}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Exact cost so far <span className="font-semibold text-gray-800 dark:text-gray-100">{php(paid.php)}</span>
              {blended != null && <> · {php(blended)} per 1M G</>}
              {costGold == null && <> · set the Cost (G) in Edit Account to track what's left</>}
            </p>
          </div>

          {/* Payments made */}
          {payments.length > 0 ? (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  {p.method === 'cash'
                    ? <Wallet size={16} className="shrink-0 text-sky-500" />
                    : <Coins size={16} className="shrink-0 text-amber-500" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{describePayment(p)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.date}{p.note ? ` · ${p.note}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{g(p.gold)}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">{php(p.cost_php)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoving(p)}
                    title="Remove payment"
                    aria-label="Remove payment"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No payments yet. Until there are, the cost uses the rates in Edit Account.
            </p>
          )}

        </div>

          {/* Add a payment */}
          {left !== 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Add a payment</p>
              <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800" role="tablist">
                <button type="button" role="tab" aria-selected={method === 'gold_trade'} className={tabCls(method === 'gold_trade')} onClick={() => { setMethod('gold_trade'); setErrors({}) }}>
                  <Coins size={14} /> Gold from a trade
                </button>
                <button type="button" role="tab" aria-selected={method === 'cash'} className={tabCls(method === 'cash')} onClick={() => { setMethod('cash'); setErrors({}) }}>
                  <Wallet size={14} /> Cash from a wallet
                </button>
              </div>

              {method === 'gold_trade' ? (
                trades.length ? (
                  <TradePicker
                    trades={trades}
                    value={trade?.id ?? null}
                    onChange={(id) => { setTradeId(String(id)); setErrors((e) => ({ ...e, source_trade_id: undefined, gold: undefined })) }}
                    error={errors.source_trade_id}
                  />
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No pending gold trades. Add the gold you bought in Sales → Add Transaction → Gold first.</p>
                )
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Select
                    label="Wallet"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    placeholder="Pick a wallet"
                    error={errors.balance_account}
                    options={wallets.filter((w) => !w.hidden_at).map((w) => ({
                      value: w.code,
                      label: `${w.name} (${w.currency})${w.balance != null ? ` · ${w.currency === 'PHP' ? php(w.balance) : `$${w.balance.toLocaleString()}`}` : ''}`,
                    }))}
                  />
                  <Input
                    label={`Amount paid${walletCfg ? ` (${walletCfg.currency})` : ''}`}
                    inputMode="decimal"
                    value={formatWithCommas(cash)}
                    onChange={(e) => handleAmountInput(e.target.value, setCash)}
                    error={errors.cash_amount}
                  />
                  {walletCfg && walletCfg.currency !== 'PHP' && (
                    <Input label="₱ rate" inputMode="decimal" value={phpRate} onChange={(e) => handleAmountInput(e.target.value, setPhpRate)} error={errors.php_rate} />
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="pay-gold" className="text-sm font-medium text-gray-700 dark:text-gray-300">Gold this covers</label>
                    {maxGold != null && maxGold > 0 && (
                      <button type="button" onClick={() => setGold(String(maxGold))} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                        Max {g(maxGold)}
                      </button>
                    )}
                  </div>
                  <Input id="pay-gold" inputMode="numeric" value={formatWithCommas(gold, false)} onChange={(e) => handleAmountInput(e.target.value, setGold, false)} error={errors.gold} placeholder="0" />
                </div>
                <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} />
              </div>
              <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. paid to seller in 2 parts" />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Cost of this payment: <span className="font-semibold text-red-600 dark:text-red-400">{previewPhp != null ? php(previewPhp) : '—'}</span>
                </p>
                <Button onClick={submit} loading={saving} disabled={saving || (method === 'gold_trade' && !trades.length)}>Add payment</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        loading={removeBusy}
        title="Remove payment"
        confirmLabel="Remove"
        message={removing?.method === 'cash'
          ? `Remove this payment? ${removing.balance_account} gets its cash back.`
          : 'Remove this payment? Its gold goes back to the gold trade and your stash.'}
      />
    </>
  )
}
