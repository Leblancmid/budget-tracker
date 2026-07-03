import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { BusinessTransaction, BusinessTransactionType, BusinessTransactionAction } from '@/types'
import type { BusinessTransactionPayload } from '@/api/business'
import { formatWithCommas, handleAmountInput, todayISO } from '@/utils/format'
import { flattenApiErrors } from '@/utils/api'

interface BusinessTransactionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: BusinessTransactionPayload) => Promise<void>
  transaction?: BusinessTransaction | null
}

const TYPE_BUTTONS: { value: BusinessTransactionType; label: string }[] = [
  { value: 'account', label: 'Account' },
  { value: 'gold',    label: 'Gold'    },
  { value: 'expense', label: 'Item'    },
]

const EMPTY = (): BusinessTransactionPayload => ({
  type:        'account',
  action:      null,
  amount:      0,
  description: '',
  date:        todayISO(),
  notes:       '',
})

export function BusinessTransactionModal({ open, onClose, onSubmit, transaction }: BusinessTransactionModalProps) {
  const [form, setForm]       = useState<BusinessTransactionPayload>(EMPTY())
  const [amountStr, setAmountStr] = useState('')
  const [errors, setErrors]   = useState<Partial<Record<string, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      if (transaction) {
        const amt = parseFloat(transaction.amount)
        setAmountStr(String(amt))
        setForm({ type: transaction.type, action: transaction.action, amount: amt, description: transaction.description ?? '', date: transaction.date, notes: '' })
      } else {
        setAmountStr('')
        setForm(EMPTY())
      }
    }
  }, [open, transaction])

  const set = <K extends keyof BusinessTransactionPayload>(key: K, value: BusinessTransactionPayload[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  const handleTypeChange = (type: BusinessTransactionType) => {
    setForm((p) => ({ ...p, type }))
  }

  const handleActionToggle = (action: BusinessTransactionAction) => {
    set('action', form.action === action ? null : action)
  }

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

  return (
    <Modal open={open} onClose={onClose} title={transaction ? 'Edit Transaction' : 'Add Transaction'}>
      <div className="flex flex-col gap-4">

        {/* Action — Buy / Sell */}
        <div className="flex gap-2">
          {(['buy', 'sell'] as BusinessTransactionAction[]).map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => handleActionToggle(action)}
              className={[
                'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                form.action === action
                  ? action === 'buy'
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
                    : 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {action === 'buy' ? '− Buy' : '+ Sell'}
            </button>
          ))}
        </div>

        {/* Type — Account / Gold / Item */}
        <div className="flex gap-2">
          {TYPE_BUTTONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeChange(value)}
              className={[
                'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                form.type === value
                  ? value === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
                    : 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Amount + Date in one row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Amount"
              type="text"
              inputMode="decimal"
              value={formatWithCommas(amountStr)}
              onChange={(e) => handleAmountInput(e.target.value, (s) => { setAmountStr(s); set('amount', parseFloat(s) || 0) })}
              error={errors.amount}
              placeholder="0.00"
            />
          </div>
          <div className="flex-1">
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              error={errors.date}
            />
          </div>
        </div>

        <Input
          label="Description"
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional short description"
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {transaction ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
