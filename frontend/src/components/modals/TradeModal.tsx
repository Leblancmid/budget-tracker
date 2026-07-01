import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { TradePayload } from '@/api/rucoy'
import type { Trade, TradeCurrency, TradePaymentMethod, TradeStatus } from '@/types'

interface TradeModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TradePayload) => Promise<void>
  trade?: Trade | null
}

const CURRENCIES: { value: TradeCurrency; symbol: string; label: string }[] = [
  { value: 'PHP', symbol: '₱', label: '₱ PHP' },
  { value: 'USD', symbol: '$', label: '$ USD' },
  { value: 'EUR', symbol: '€', label: '€ EUR' },
]

const PAYMENT_METHODS: { value: TradePaymentMethod; label: string }[] = [
  { value: 'binance', label: 'Binance' },
  { value: 'paypal',  label: 'PayPal' },
]

interface TradeForm {
  description: string
  status: TradeStatus
  amount: string
  currency: TradeCurrency
  payment_method: TradePaymentMethod | ''
  completion_date: string
}

const EMPTY: TradeForm = {
  description: '',
  status: 'kks',
  amount: '',
  currency: 'PHP',
  payment_method: '',
  completion_date: '',
}

function formatWithCommas(raw: string, allowDecimal: boolean): string {
  if (!raw) return ''
  const [integer, decimal] = raw.split('.')
  const intFormatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (!allowDecimal || decimal === undefined) return intFormatted
  return `${intFormatted}.${decimal}`
}

function handleAmountInput(
  value: string,
  allowDecimal: boolean,
  setter: (v: string) => void,
) {
  const stripped = value.replace(/,/g, '')
  const pattern = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/
  if (stripped === '' || pattern.test(stripped)) setter(stripped)
}

export function TradeModal({ open, onClose, onSubmit, trade }: TradeModalProps) {
  const [form, setForm] = useState<TradeForm>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof TradeForm, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      setForm(trade ? {
        description:     trade.description ?? '',
        status:          trade.status,
        amount:          parseFloat(trade.amount).toString(),
        currency:        trade.currency ?? 'PHP',
        payment_method:  trade.payment_method ?? '',
        completion_date: trade.completion_date ?? '',
      } : EMPTY)
    }
  }, [open, trade])

  const set = <K extends keyof TradeForm>(k: K, v: TradeForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) < 0)
      errs.amount = 'Enter a valid amount.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({
        description:     form.description || undefined,
        status:          form.status,
        amount:          parseFloat(form.amount),
        currency:        form.status === 'cash' ? form.currency : null,
        payment_method:  form.status === 'cash' && form.payment_method ? form.payment_method : null,
        completion_date: form.completion_date || null,
      })
      onClose()
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]> }
      if (e.errors)
        setErrors(Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])))
    } finally {
      setLoading(false)
    }
  }

  const isCash = form.status === 'cash'

  return (
    <Modal open={open} onClose={onClose} title={trade ? 'Edit Trade' : 'New Trade'}>
      <div className="flex flex-col gap-4">

        {/* Description — top */}
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional trade notes"
        />

        {/* Status toggle */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Type</p>
          <div className="flex gap-2">
            {(['kks', 'cash'] as TradeStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('status', s)}
                className={[
                  'flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors uppercase',
                  form.status === s
                    ? s === 'cash'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700'
                      : 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                ].join(' ')}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Amount — with currency prefix for CASH, plain for KKS */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            {isCash ? 'Amount' : 'Gold Amount'}
          </p>
          <div className="flex gap-2">
            {isCash && (
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value as TradeCurrency)}
                className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            )}
            <div className="flex-1">
              <input
                type="text"
                inputMode="decimal"
                value={formatWithCommas(form.amount, isCash)}
                onChange={(e) => handleAmountInput(e.target.value, isCash, (v) => set('amount', v))}
                placeholder={isCash ? '0.00' : '0'}
                className={[
                  'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
                  'placeholder:text-gray-400 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                  'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
                  errors.amount
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500',
                ].join(' ')}
              />
            </div>
          </div>
          {errors.amount && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.amount}</p>}
          {!isCash && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              This will add to your total gold count.
            </p>
          )}
        </div>

        {/* Payment method — CASH only */}
        {isCash && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</p>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => set('payment_method', form.payment_method === m.value ? '' : m.value)}
                  className={[
                    'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                    form.payment_method === m.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-600'
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                  ].join(' ')}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Completion date */}
        <Input
          label="Completion Date"
          type="date"
          value={form.completion_date}
          onChange={(e) => set('completion_date', e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {trade ? 'Save Changes' : 'Add Trade'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
