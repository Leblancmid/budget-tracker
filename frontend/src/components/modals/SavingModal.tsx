import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Saving, SavingModeOfPayment, SavingTransfer } from '@/types'
import type { SavingPayload } from '@/api/master'

interface SavingModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: SavingPayload) => Promise<void>
  saving?: Saving | null
}

const EMPTY = (): SavingPayload => ({
  mode_of_payment: 'CIMB',
  type:            'deposit',
  transfer:        null,
  description:     '',
  amount:          0,
  date:            new Date().toISOString().split('T')[0],
})

const MODE_OPTIONS: { value: SavingModeOfPayment; label: string }[] = [
  { value: 'CIMB',     label: 'CIMB'     },
  { value: 'MARIBANK', label: 'MARIBANK' },
  { value: 'GCASH',    label: 'GCash'    },
]

const TRANSFER_OPTIONS: { value: SavingTransfer; label: string }[] = [
  { value: 'daily_expenses', label: 'Daily Expenses' },
  { value: 'business',       label: 'Business'       },
]

export function SavingModal({ open, onClose, onSubmit, saving }: SavingModalProps) {
  const [form, setForm]     = useState<SavingPayload>(EMPTY())
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      setForm(
        saving
          ? {
              mode_of_payment: saving.mode_of_payment,
              type:            saving.type,
              transfer:        saving.transfer,
              description:     saving.description ?? '',
              amount:          parseFloat(saving.amount),
              date:            saving.date,
            }
          : EMPTY()
      )
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
      const e = err as { errors?: Record<string, string[]> }
      if (e.errors) setErrors(Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])))
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

        <Select
          label="Transfer (optional)"
          placeholder="None"
          value={form.transfer ?? ''}
          onChange={(e) => set('transfer', (e.target.value as SavingTransfer) || null)}
          options={TRANSFER_OPTIONS}
        />

        <Input
          label="Amount"
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount || ''}
          onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
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
