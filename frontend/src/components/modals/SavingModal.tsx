import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatWithCommas, handleAmountInput, todayISO } from '@/utils/format'
import { Amt } from '@/context/AmountVisibilityContext'
import { flattenApiErrors } from '@/utils/api'
import type { Saving, SavingModeOfPayment, SavingTransfer } from '@/types'
import type { SavingPayload } from '@/api/master'

interface SavingModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: SavingPayload) => Promise<void>
  saving?: Saving | null
  dailyBalance?: number
  businessBalance?: number
}

const EMPTY = (): SavingPayload => ({
  mode_of_payment: 'CIMB',
  type:            'deposit',
  transfer:        null,
  description:     '',
  amount:          0,
  date:            todayISO(),
})

const MODE_OPTIONS: { value: SavingModeOfPayment; label: string }[] = [
  { value: 'CIMB',     label: 'CIMB'     },
  { value: 'MARIBANK', label: 'MARIBANK' },
  { value: 'GCASH',    label: 'GCash'    },
]


export function SavingModal({ open, onClose, onSubmit, saving, dailyBalance, businessBalance }: SavingModalProps) {
  const [form, setForm]     = useState<SavingPayload>(EMPTY())
  const [amountStr, setAmountStr] = useState('')
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      if (saving) {
        const amt = parseFloat(saving.amount)
        setAmountStr(String(amt))
        setForm({ mode_of_payment: saving.mode_of_payment, type: saving.type, transfer: saving.transfer, description: saving.description ?? '', amount: amt, date: saving.date })
      } else {
        setAmountStr('')
        setForm(EMPTY())
      }
    }
  }, [open, saving])

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.amount || form.amount <= 0) errs.amount = 'Amount must be greater than 0.'
    if (!form.date) errs.date = 'Date is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit(form)
      onClose()
    } catch (err: unknown) {
      const flat = flattenApiErrors(err)
      if (flat) setErrors(flat)
    } finally {
      setLoading(false)
    }
  }

  const set = <K extends keyof SavingPayload>(key: K, value: SavingPayload[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  return (
    <Modal open={open} onClose={onClose} title={saving ? 'Edit Saving' : 'Add Saving'}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {(['deposit', 'withdraw'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set('type', t)}
              className={[
                'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors capitalize',
                form.type === t
                  ? t === 'deposit'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700'
                    : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        <Select
          label="Mode of Payment"
          value={form.mode_of_payment}
          onChange={(e) => set('mode_of_payment', e.target.value as SavingModeOfPayment)}
          options={MODE_OPTIONS}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Transfer (optional)</span>
          <div className="flex gap-2">
            {([
              { value: 'daily_expenses' as SavingTransfer, label: 'Daily Expenses', balance: dailyBalance },
              { value: 'business'       as SavingTransfer, label: 'Business',       balance: businessBalance },
            ]).map(({ value, label, balance }) => {
              const active = form.transfer === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('transfer', active ? null : value)}
                  className={[
                    'flex-1 rounded-lg border px-3 py-2 text-left transition-colors',
                    active
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-600'
                      : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
                  ].join(' ')}
                >
                  <p className={['text-xs font-semibold', active ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'].join(' ')}>
                    {label}
                  </p>
                  <p className={['text-[11px] mt-0.5', active ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'].join(' ')}>
                    {balance !== undefined ? <Amt value={formatCurrency(balance)} /> : '—'}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        <Input
          label="Amount"
          type="text"
          inputMode="decimal"
          value={formatWithCommas(amountStr)}
          onChange={(e) => handleAmountInput(e.target.value, (s) => { setAmountStr(s); set('amount', parseFloat(s) || 0) })}
          error={errors.amount}
          placeholder="0.00"
        />

        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          error={errors.date}
        />

        <Input
          label="Description"
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional short description"
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {saving ? 'Save Changes' : 'Add Saving'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
