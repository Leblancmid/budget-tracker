import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { AccountPayload } from '@/api/rucoy'
import type { BusinessTransactionPayload } from '@/api/business'
import type { AccountPaymentStatus, BusinessTransaction, RucoyAccount } from '@/types'
import { formatWithCommas, handleAmountInput, todayISO } from '@/utils/format'
import { flattenApiErrors } from '@/utils/api'

export type RucoyTxKind = 'account' | 'gold'

/** Pricing part of an account's linked business transaction (account_id is filled in by the caller). */
export type AccountPricingPayload = Omit<BusinessTransactionPayload, 'account_id'>

interface RucoyTransactionModalProps {
  open: boolean
  onClose: () => void
  kind: RucoyTxKind
  /** Account being edited (kind = account) */
  account?: RucoyAccount | null
  /** Business transaction linked to the edited account (kind = account) */
  accountTx?: BusinessTransaction | null
  /** Gold trade being edited (kind = gold) */
  goldTx?: BusinessTransaction | null
  onSubmitAccount: (account: AccountPayload, pricing: AccountPricingPayload | null) => Promise<void>
  onSubmitGold: (data: BusinessTransactionPayload) => Promise<void>
}

const num = (v: string | null | undefined) => (v != null && v !== '' ? String(parseFloat(v)) : '')
const round2 = (v: number) => Math.round(v * 100) / 100
const fmtUSD = (v: number | null) =>
  v != null ? `$${v.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
const fmtPHP = (v: number | null) =>
  v != null ? `₱${v.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'

const inputCls = 'block w-full rounded-lg border border-gray-300 hover:border-gray-400 bg-white px-2.5 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-600 dark:hover:border-gray-500 transition-colors'
const readonlyCls = 'rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs sm:text-sm font-semibold dark:border-gray-700 dark:bg-gray-800/60 truncate'

export function RucoyTransactionModal({ open, onClose, kind, account, accountTx, goldTx, onSubmitAccount, onSubmitGold }: RucoyTransactionModalProps) {
  const isEdit = kind === 'account' ? !!account : !!goldTx

  // Account-only fields
  const [email, setEmail]                 = useState('')
  const [paymentStatus, setPaymentStatus] = useState<AccountPaymentStatus>('not_paid')
  const [paymentDate, setPaymentDate]     = useState('')

  // Shared fields
  const [description, setDescription]   = useState('')
  const [priceGold, setPriceGold]       = useState('')
  const [costGold, setCostGold]         = useState('')
  const [priceRate, setPriceRate]       = useState('')
  const [costRate, setCostRate]         = useState('')
  const [pricePhpRate, setPricePhpRate] = useState('')
  const [costPhpRate, setCostPhpRate]   = useState('')
  const [date, setDate]                 = useState(todayISO())

  // Gold-only: how much of the price has been received / cost has been paid so far
  const [receivedGold, setReceivedGold] = useState('')
  const [paidGold, setPaidGold]         = useState('')

  const [errors, setErrors]   = useState<Partial<Record<string, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    const tx = kind === 'account' ? accountTx : goldTx
    setEmail(account?.email ?? '')
    setPaymentStatus(account?.payment_status ?? 'not_paid')
    setPaymentDate(account?.payment_date ?? '')
    setDescription(kind === 'account' ? (account?.description ?? '') : (goldTx?.description ?? ''))
    setPriceGold(kind === 'account'
      ? (account?.price != null ? String(account.price) : '')
      : num(goldTx?.price_gold))
    setCostGold(kind === 'account'
      ? (account?.cost != null ? String(account.cost) : '')
      : num(goldTx?.cost_gold))
    setPriceRate(num(tx?.price_rate))
    setCostRate(num(tx?.cost_rate))
    setPricePhpRate(num(tx?.php_rate))
    setCostPhpRate(num(tx?.cost_php_rate) || num(tx?.php_rate))
    setDate(tx?.date ?? todayISO())
    setReceivedGold(num(goldTx?.price_gold_received))
    setPaidGold(num(goldTx?.cost_gold_paid))
  }, [open, kind, account, accountTx, goldTx])

  // Formula: G / 1M × rate = $  →  $ × PHP rate = ₱
  const priceGoldNum = parseFloat(priceGold) || null
  const costGoldNum  = parseFloat(costGold)  || null
  const priceUsd = priceGoldNum != null && parseFloat(priceRate) ? (priceGoldNum / 1_000_000) * parseFloat(priceRate) : null
  const costUsd  = costGoldNum  != null && parseFloat(costRate)  ? (costGoldNum  / 1_000_000) * parseFloat(costRate)  : null
  const profitUsd = priceUsd != null && costUsd != null ? priceUsd - costUsd : null
  const pricePhp = priceUsd != null && parseFloat(pricePhpRate) ? priceUsd * parseFloat(pricePhpRate) : null
  const costPhp  = costUsd  != null && parseFloat(costPhpRate)  ? costUsd  * parseFloat(costPhpRate)  : null
  const profitPhp = pricePhp != null && costPhp != null ? pricePhp - costPhp : null

  const receivedGoldNum = receivedGold !== '' ? parseFloat(receivedGold) : null
  const paidGoldNum     = paidGold     !== '' ? parseFloat(paidGold)     : null

  const hasRates = [priceRate, costRate, pricePhpRate, costPhpRate].some((v) => v !== '')

  const buildPricing = (type: 'account' | 'gold'): AccountPricingPayload => {
    // amount is required (> 0) by the API; profit drives it, with a floor for pending/negative trades
    const amount = profitPhp ?? profitUsd
    return {
      type,
      action:        null,
      amount:        amount != null && amount > 0 ? round2(amount) : 0.01,
      description:   description || null,
      date,
      price_rate:    parseFloat(priceRate)    || null,
      cost_rate:     parseFloat(costRate)     || null,
      php_rate:      parseFloat(pricePhpRate) || null,
      cost_php_rate: parseFloat(costPhpRate)  || null,
      price_php:     pricePhp != null ? round2(pricePhp) : null,
      cost_php:      costPhp  != null ? round2(costPhp)  : null,
    }
  }

  const validate = () => {
    const errs: typeof errors = {}
    if (kind === 'account') {
      if (!email.trim()) errs.email = 'Email is required.'
    } else {
      if (priceGoldNum == null) errs.price_gold = 'Price (G) is required.'
      if (costGoldNum == null)  errs.cost_gold  = 'Cost (G) is required.'
      if (!date) errs.date = 'Date is required.'
      if (receivedGoldNum != null && priceGoldNum != null && receivedGoldNum > priceGoldNum)
        errs.price_gold_received = 'Received cannot be more than the price.'
      if (paidGoldNum != null && costGoldNum != null && paidGoldNum > costGoldNum)
        errs.cost_gold_paid = 'Paid cannot be more than the cost.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      if (kind === 'account') {
        await onSubmitAccount(
          {
            email:          email.trim(),
            description:    description,
            price:          priceGoldNum,
            cost:           costGoldNum,
            payment_status: paymentStatus,
            payment_date:   paymentDate || null,
          },
          accountTx || hasRates ? buildPricing('account') : null,
        )
      } else {
        await onSubmitGold({
          ...buildPricing('gold'),
          price_gold:          priceGoldNum,
          cost_gold:           costGoldNum,
          price_gold_received: receivedGoldNum,
          cost_gold_paid:      paidGoldNum,
        })
      }
      onClose()
    } catch (err: unknown) {
      const flat = flattenApiErrors(err)
      if (flat) setErrors(flat)
    } finally {
      setLoading(false)
    }
  }

  const formulaRows = [
    {
      key: 'price', gold: priceGold, onGold: setPriceGold, goldError: errors.price_gold,
      labels: ['Price (G)', 'Price Rate ($)', 'Price ($)', 'PHP Rate', 'Price (₱)'],
      rate: priceRate, onRate: setPriceRate, usd: priceUsd,
      phpRate: pricePhpRate, onPhpRate: setPricePhpRate, php: pricePhp,
      color: 'text-emerald-600 dark:text-emerald-400',
      progress: { label: 'Received so far', value: receivedGold, onChange: setReceivedGold, num: receivedGoldNum, total: priceGoldNum, error: errors.price_gold_received },
    },
    {
      key: 'cost', gold: costGold, onGold: setCostGold, goldError: errors.cost_gold,
      labels: ['Cost (G)', 'Cost Rate ($)', 'Cost ($)', 'PHP Rate', 'Cost (₱)'],
      rate: costRate, onRate: setCostRate, usd: costUsd,
      phpRate: costPhpRate, onPhpRate: setCostPhpRate, php: costPhp,
      color: 'text-red-600 dark:text-red-400',
      progress: { label: 'Paid so far', value: paidGold, onChange: setPaidGold, num: paidGoldNum, total: costGoldNum, error: errors.cost_gold_paid },
    },
  ]

  const dueBadge = (() => {
    if (!paymentDate) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const diff  = Math.round((new Date(paymentDate + 'T00:00:00').getTime() - today.getTime()) / 86400000)
    const color = diff < 0
      ? 'text-red-600 dark:text-red-400'
      : diff === 0
      ? 'text-orange-500 dark:text-orange-400'
      : diff <= 7
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400'
    const label = diff < 0 ? `Overdue by ${Math.abs(diff)}d` : diff === 0 ? 'Due today' : `Due in ${diff}d`
    return (
      <span className={['inline-flex items-center gap-1 text-[11px] font-semibold', color].join(' ')}>
        <CalendarClock size={11} />
        {label}
      </span>
    )
  })()

  const title = `${isEdit ? 'Edit' : 'Add'} ${kind === 'account' ? 'Account' : 'Gold'}`

  return (
    <Modal open={open} onClose={onClose} title={title} size="2xl">
      <div className="flex flex-col gap-4">

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={kind === 'account' ? 'e.g. Leblanc 583 Dist' : 'e.g. 9/100 Crash'}
        />

        {kind === 'account' && (
          <>
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="account@example.com"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</p>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as AccountPaymentStatus)}
                  className={inputCls}
                >
                  <option value="not_paid">Not Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="fully_paid">Fully Paid</option>
                </select>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date</p>
                  {dueBadge}
                </div>
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputCls} />
              </div>
            </div>
          </>
        )}

        {/* Formula rows: G × rate = $ × PHP rate = ₱ */}
        {formulaRows.map((row) => (
          <div key={row.key}>
            <div className="flex items-end gap-1.5 sm:gap-2">
              <div className="flex-[1.3] min-w-0">
                <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{row.labels[0]}</p>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatWithCommas(row.gold)}
                  onChange={(e) => handleAmountInput(e.target.value, row.onGold)}
                  placeholder="0"
                  className={[inputCls, row.goldError ? 'border-red-400 dark:border-red-500' : ''].join(' ')}
                />
              </div>
              <span className="pb-2 text-gray-400 dark:text-gray-500 text-xs sm:text-sm font-medium shrink-0">×</span>
              <div className="flex-1 min-w-0">
                <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{row.labels[1]}</p>
                <input type="text" inputMode="decimal" value={row.rate} onChange={(e) => handleAmountInput(e.target.value, row.onRate)} placeholder="0.25" className={inputCls} />
              </div>
              <span className="pb-2 text-gray-400 dark:text-gray-500 text-xs sm:text-sm font-medium shrink-0">=</span>
              <div className="flex-1 min-w-0">
                <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{row.labels[2]}</p>
                <div className={[readonlyCls, row.color].join(' ')}>{fmtUSD(row.usd)}</div>
              </div>
              <span className="pb-2 text-gray-400 dark:text-gray-500 text-xs sm:text-sm font-medium shrink-0">×</span>
              <div className="flex-1 min-w-0">
                <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{row.labels[3]}</p>
                <input type="text" inputMode="decimal" value={row.phpRate} onChange={(e) => handleAmountInput(e.target.value, row.onPhpRate)} placeholder="58.5" className={inputCls} />
              </div>
              <span className="pb-2 text-gray-400 dark:text-gray-500 text-xs sm:text-sm font-medium shrink-0">=</span>
              <div className="flex-[1.2] min-w-0">
                <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{row.labels[4]}</p>
                <div className={[readonlyCls, row.color].join(' ')}>{fmtPHP(row.php)}</div>
              </div>
            </div>
            {row.goldError && <p className="mt-1 text-xs text-red-500">{row.goldError}</p>}

            {/* Gold only: partial received / paid tracking */}
            {kind === 'gold' && (() => {
              const p   = row.progress
              const pct = p.total ? ((p.num ?? 0) / p.total) * 100 : 0
              return (
                <div className="mt-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-24 shrink-0">{p.label}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formatWithCommas(p.value)}
                      onChange={(e) => handleAmountInput(e.target.value, p.onChange)}
                      placeholder="0"
                      className={[inputCls, '!w-40 !py-1', p.error ? 'border-red-400 dark:border-red-500' : ''].join(' ')}
                    />
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      of {p.total != null ? p.total.toLocaleString() : '—'} G
                    </span>
                    <ProgressBar percent={pct} color="bg-amber-500" className="flex-1 min-w-[60px]" />
                    <span className={['text-xs font-semibold w-10 text-right', pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'].join(' ')}>
                      {Math.round(pct)}%
                    </span>
                    <button
                      type="button"
                      disabled={p.total == null}
                      onClick={() => p.total != null && p.onChange(String(p.total))}
                      className="rounded-md border border-gray-200 dark:border-gray-600 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                    >
                      All
                    </button>
                  </div>
                  {p.error && <p className="mt-1 text-xs text-red-500">{p.error}</p>}
                </div>
              )
            })()}
          </div>
        ))}

        {/* Profit ($) | Profit (₱) */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Profit ($)', value: profitUsd, text: fmtUSD(profitUsd) },
            { label: 'Profit (₱)', value: profitPhp, text: fmtPHP(profitPhp) },
          ].map(({ label, value, text }) => (
            <div key={label} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className={['text-sm font-semibold mt-0.5', value == null || value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                {text}
              </p>
            </div>
          ))}
        </div>

        {kind === 'gold' && (
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} />
        )}

        {!hasRates && (
          <p className="text-xs text-gray-400 dark:text-gray-500 -mt-1">
            Rates are optional — leave them blank and it will show as <span className="font-semibold text-amber-600 dark:text-amber-400">Awaiting pricing</span> until you fill them in.
          </p>
        )}

        {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEdit ? 'Save Changes' : kind === 'account' ? 'Add Account' : 'Add Gold'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
