import { useEffect, useState } from 'react'
import { Banknote, CalendarClock, Coins } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { AccountPayload } from '@/api/rucoy'
import type { BusinessTransactionPayload } from '@/api/business'
import type { AccountPaymentStatus, BusinessTransaction, RucoyAccount } from '@/types'
import { formatWithCommas, handleAmountInput, todayISO } from '@/utils/format'
import { flattenApiErrors } from '@/utils/api'
import { screenshotError } from '@/utils/listing'
import { ScreenshotField } from './ScreenshotField'
import { accountCostPhp } from '@/utils/accountCost'
import { cashToPhp, type CashCurrency } from '@/utils/cash'
import { CashPricing } from './CashPricing'
import { AccessoryPicker } from './AccessoryPicker'

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

type StatKey = 'level' | 'melee' | 'distance' | 'magic' | 'defense'

/** In-game Stats screen fields, in the order the game shows them. */
const STAT_FIELDS: { key: StatKey; label: string; min: number }[] = [
  { key: 'level',    label: 'Level',    min: 1 },
  { key: 'melee',    label: 'Melee',    min: 0 },
  { key: 'distance', label: 'Distance', min: 0 },
  { key: 'magic',    label: 'Magic',    min: 0 },
  { key: 'defense',  label: 'Defense',  min: 0 },
]
const EMPTY_STATS = Object.fromEntries(STAT_FIELDS.map(({ key }) => [key, ''])) as Record<StatKey, string>

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

  // Account-only: what buyers see in the listing
  const [stats, setStats]           = useState<Record<StatKey, string>>(EMPTY_STATS)
  const [showPrice, setShowPrice]   = useState(false)
  const [accessories, setAccessories] = useState<string[]>([])
  // Gold deal (G × rates) or cash deal (₱ / $ amounts)
  const [dealType, setDealType]     = useState<'gold' | 'cash'>('gold')
  const [currency, setCurrency]     = useState<CashCurrency>('PHP')
  const [priceCash, setPriceCash]   = useState('')
  const [costCash, setCostCash]     = useState('')
  const [shotFile, setShotFile]     = useState<File | null>(null)
  const [shotRemoved, setShotRemoved] = useState(false)

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
    setStats(Object.fromEntries(STAT_FIELDS.map(({ key }) => [key, account?.[key] != null ? String(account[key]) : ''])) as Record<StatKey, string>)
    setShowPrice(account?.show_price ?? false)
    setAccessories(account?.accessories ?? [])
    setDealType(account?.deal_type ?? 'gold')
    setCurrency(account?.cash_currency ?? 'PHP')
    setPriceCash(account?.price_cash != null ? String(account.price_cash) : '')
    setCostCash(account?.cost_cash != null ? String(account.cost_cash) : '')
    setShotFile(null)
    setShotRemoved(false)
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
  // '' = not entered; 0 is a valid amount (e.g. gold that cost nothing)
  const parseGold = (v: string) => (v !== '' && Number.isFinite(parseFloat(v)) ? parseFloat(v) : null)
  const priceGoldNum = parseGold(priceGold)
  const costGoldNum  = parseGold(costGold)
  // 0 G is worth $0 / ₱0 whatever the rates, so a free side never blocks the profit
  const toUsd = (gold: number | null, rate: string) =>
    gold === 0 ? 0 : gold != null && parseFloat(rate) ? (gold / 1_000_000) * parseFloat(rate) : null
  const toPhp = (gold: number | null, usd: number | null, rate: string) =>
    gold === 0 ? 0 : usd != null && parseFloat(rate) ? usd * parseFloat(rate) : null
  // An account paid with payments (gold trades / cash at different rates): its ₱ cost is exact,
  // the same as the server works out; there's no single $ cost any more.
  const paid = kind === 'account' && account && (account.paid_gold ?? 0) > 0
    ? { gold: account.paid_gold ?? 0, php: account.paid_cost_php ?? 0 }
    : null
  // A gold trade's gold changes only through Add Gold / Sell / account payments
  const lockGold = kind === 'gold' && isEdit

  const isCash = kind === 'account' && dealType === 'cash'
  const cashNum = (v: string) => (v !== '' && Number.isFinite(parseFloat(v)) ? parseFloat(v) : null)

  const priceUsd = isCash ? (currency === 'USD' ? cashNum(priceCash) : null) : toUsd(priceGoldNum, priceRate)
  const costUsd  = isCash ? (currency === 'USD' ? cashNum(costCash) : null) : paid ? null : toUsd(costGoldNum, costRate)
  const profitUsd = priceUsd != null && costUsd != null ? priceUsd - costUsd : null
  const pricePhp = isCash ? cashToPhp(priceCash, currency, pricePhpRate) : toPhp(priceGoldNum, priceUsd, pricePhpRate)
  const costPhp  = isCash
    ? cashToPhp(costCash, currency, costPhpRate)
    : paid
    ? accountCostPhp(paid, costGoldNum, parseFloat(costRate) || null, parseFloat(costPhpRate) || null)
    : toPhp(costGoldNum, costUsd, costPhpRate)
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
      price_rate:    isCash ? null : parseFloat(priceRate) || null,
      cost_rate:     isCash ? null : parseFloat(costRate)  || null,
      // Cash in pesos needs no rate; dollars keep each side's ₱ rate
      php_rate:      isCash && currency === 'PHP' ? null : parseFloat(pricePhpRate) || null,
      cost_php_rate: isCash && currency === 'PHP' ? null : parseFloat(costPhpRate)  || null,
      price_php:     pricePhp != null ? round2(pricePhp) : null,
      cost_php:      costPhp  != null ? round2(costPhp)  : null,
    }
  }

  const validate = () => {
    const errs: typeof errors = {}
    if (kind === 'account') {
      if (!email.trim()) errs.email = 'Email is required.'
      if (!description.trim()) errs.description = 'Description is required.'
      for (const { key, label, min } of STAT_FIELDS) {
        const v = stats[key]
        if (v !== '' && (!/^\d+$/.test(v) || Number(v) < min || Number(v) > 9999)) {
          errs[key] = `${label} must be a whole number${min ? ' above 0' : ''}.`
        }
      }
      if (shotFile) {
        const shotErr = screenshotError(shotFile)
        if (shotErr) errs.screenshot = shotErr
      }
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
            deal_type:      dealType,
            price:          isCash ? null : priceGoldNum,
            cost:           isCash ? null : costGoldNum,
            price_cash:     isCash ? cashNum(priceCash) : null,
            cost_cash:      isCash ? cashNum(costCash) : null,
            cash_currency:  isCash ? currency : null,
            payment_status: paymentStatus,
            payment_date:   paymentDate || null,
            ...Object.fromEntries(STAT_FIELDS.map(({ key }) => [key, stats[key] !== '' ? Number(stats[key]) : null])),
            show_price:        showPrice,
            accessories,
            screenshot:        shotFile,
            remove_screenshot: shotRemoved && !shotFile,
          },
          accountTx || hasRates || (isCash && (priceCash !== '' || costCash !== '')) ? buildPricing('account') : null,
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
    // Accounts have a lot to fill in: on wide screens, details + listing on the left and
    // pricing on the right, so everything is visible without scrolling. Gold trades stay narrow.
    <Modal open={open} onClose={onClose} title={title} size={kind === 'account' ? '6xl' : '2xl'}>
      <div className={kind === 'account' ? 'grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2' : 'flex flex-col gap-4'}>
      <div className="flex flex-col gap-4">

        <div className={kind === 'account' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : ''}>
          <Input
            label="Description"
            value={description}
            error={errors.description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={kind === 'account' ? 'e.g. Leblanc 583 Dist' : 'e.g. 9/100 Crash'}
          />
          {kind === 'account' && (
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="account@example.com"
            />
          )}
        </div>

        {kind === 'account' && (
          <>

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

            {/* Listing: what buyers see (Listing Kit image) */}
            <fieldset className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Listing</legend>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {STAT_FIELDS.map(({ key, label }) => (
                  <div key={key} className="min-w-0">
                    <label htmlFor={`stat-${key}`} className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{label}</label>
                    <input
                      id={`stat-${key}`}
                      type="text"
                      inputMode="numeric"
                      value={stats[key]}
                      onChange={(e) => /^\d*$/.test(e.target.value) && setStats((s) => ({ ...s, [key]: e.target.value }))}
                      className={[inputCls, errors[key] ? 'border-red-400 dark:border-red-500' : ''].join(' ')}
                    />
                  </div>
                ))}
              </div>
              {STAT_FIELDS.map(({ key }) => errors[key] && <p key={key} className="mt-1 text-xs text-red-500">{errors[key]}</p>)}

              <div className="mt-3">
                <AccessoryPicker value={accessories} onChange={setAccessories} />
              </div>

              <div className="mt-3">
                <ScreenshotField
                  currentUrl={account?.screenshot ?? null}
                  file={shotFile}
                  removed={shotRemoved}
                  error={errors.screenshot}
                  onFile={(f) => { setShotFile(f); setShotRemoved(false); setErrors((e) => ({ ...e, screenshot: screenshotError(f) ?? undefined })) }}
                  onRemove={() => { setShotFile(null); setShotRemoved(true) }}
                />
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Show the price on the listing image
              </label>
            </fieldset>
          </>
        )}
      </div>

      {/* Pricing column (below the details on narrow screens) */}
      <div className="flex flex-col gap-4">

        {/* Account: priced in gold or in cash */}
        {kind === 'account' && (
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800" role="radiogroup" aria-label="Paid with">
            {([['gold', 'Gold', Coins], ['cash', 'Cash', Banknote]] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={dealType === value}
                disabled={value === 'cash' && !!paid}
                title={value === 'cash' && paid ? 'This account has gold payments. Remove them with Pay first.' : undefined}
                onClick={() => setDealType(value)}
                className={[
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-40',
                  dealType === value
                    ? ['bg-white shadow-sm dark:bg-gray-950 ring-1 ring-inset',
                       value === 'gold'
                         ? 'text-amber-600 ring-amber-300 dark:text-amber-400 dark:ring-amber-500/50'
                         : 'text-emerald-600 ring-emerald-300 dark:text-emerald-400 dark:ring-emerald-500/50'].join(' ')
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                ].join(' ')}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        )}
        {errors.deal_type && <p className="-mt-2 text-xs text-red-500">{errors.deal_type}</p>}

        {isCash && (
          <CashPricing
            currency={currency}
            onCurrency={setCurrency}
            rows={[
              { key: 'price', label: 'Selling price', hint: 'What the buyer pays you. Leave blank until it sells.', amount: priceCash, onAmount: setPriceCash, phpRate: pricePhpRate, onPhpRate: setPricePhpRate, color: 'text-emerald-600 dark:text-emerald-400' },
              { key: 'cost', label: 'Cost (what you paid)', hint: 'What you paid the seller for the account.', amount: costCash, onAmount: setCostCash, phpRate: costPhpRate, onPhpRate: setCostPhpRate, color: 'text-red-600 dark:text-red-400' },
            ]}
          />
        )}

        {/* Formula rows: G × rate = $ × PHP rate = ₱ */}
        {!isCash && formulaRows.map((row) => (
          <div key={row.key}>
            <div className="flex items-end gap-1.5 sm:gap-2">
              <div className="flex-[1.3] min-w-0">
                <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{row.labels[0]}</p>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatWithCommas(row.gold)}
                  onChange={(e) => handleAmountInput(e.target.value, row.onGold)}
                  readOnly={lockGold}
                  title={lockGold ? 'Use Add Gold or Sell to change the gold' : undefined}
                  placeholder="0"
                  className={[lockGold ? readonlyCls + ' w-full text-gray-700 dark:text-gray-200 cursor-not-allowed' : inputCls, row.goldError ? 'border-red-400 dark:border-red-500' : ''].join(' ')}
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
            {lockGold && row.key === 'cost' && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Price (G) and Cost (G) are locked: use Add Gold or Sell on the trade to change the gold.</p>
            )}

            {/* Account: paid so far, from its payments (managed with Pay on the account card) */}
            {kind === 'account' && row.key === 'cost' && account && (
              <div className="mt-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-24 shrink-0">Paid so far</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {(account.paid_gold ?? 0).toLocaleString()} of {costGoldNum != null ? costGoldNum.toLocaleString() : '—'} G
                  </span>
                  <ProgressBar percent={costGoldNum ? ((account.paid_gold ?? 0) / costGoldNum) * 100 : 0} color="bg-amber-500" className="flex-1 min-w-[60px]" />
                </div>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {paid
                    ? <>Cost (₱) is exact: {fmtPHP(paid.php)} paid at each payment's own rate{costGoldNum != null && costGoldNum > paid.gold ? ', plus the unpaid gold at the rates above' : ''}. Add or remove payments with <span className="font-semibold">Pay</span> on the account card.</>
                    : <>Paying in parts or at different rates? Use <span className="font-semibold">Pay</span> on the account card to add each payment.</>}
                </p>
              </div>
            )}

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
          ].filter(({ label }) => !(isCash && currency === 'PHP' && label === 'Profit ($)')).map(({ label, value, text }) => (
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

        {kind === 'gold' && (priceGoldNum ?? 0) > 0 && (!isEdit || goldTx?.inventory_gold != null) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
            {isEdit
              ? 'Gold changes go through Add Gold or Sell, which also update your Golds stash.'
              : <>{(priceGoldNum ?? 0).toLocaleString()} G will be added to your Golds stash in Rucoy → Summary.</>}
          </p>
        )}
        {!isCash && !hasRates && (
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
      </div>
    </Modal>
  )
}
