import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { BusinessCategory, BusinessTransaction, BusinessTransactionType } from '@/types'
import type { BusinessTransactionPayload } from '@/api/business'

interface BusinessTransactionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: BusinessTransactionPayload) => Promise<void>
  categories: BusinessCategory[]
  transaction?: BusinessTransaction | null
}

const TYPE_OPTIONS: { value: BusinessTransactionType; label: string }[] = [
  { value: 'account', label: 'Account (Income)' },
  { value: 'gold', label: 'Gold (Income)' },
  { value: 'expense', label: 'Expense' },
]

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY = (): BusinessTransactionPayload => ({
  category_id: null,
  type: 'account',
  amount: 0,
  description: '',
  date: today(),
  notes: '',
})

export function BusinessTransactionModal({ open, onClose, onSubmit, categories, transaction }: BusinessTransactionModalProps) {
  const [form, setForm] = useState<BusinessTransactionPayload>(EMPTY())
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      if (transaction) {
        setForm({
          category_id: transaction.category_id,
          type: transaction.type,
          amount: parseFloat(transaction.amount),
          description: transaction.description ?? '',
          date: transaction.date,
          notes: transaction.notes ?? '',
        })
      } else {
        setForm(EMPTY())
      }
    }
  }, [open, transaction])

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

  const set = <K extends keyof BusinessTransactionPayload>(key: K, value: BusinessTransactionPayload[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  const filteredCategories = categories.filter((c) =>
    form.type === 'expense' ? c.type === 'expense' : c.type !== 'expense'
  )

  return (
    <Modal open={open} onClose={onClose} title={transaction ? 'Edit Transaction' : 'New Business Transaction'}>
      <div className="flex flex-col gap-4">
        <Select
          label="Type"
          value={form.type}
          onChange={(e) => set('type', e.target.value as BusinessTransactionType)}
          options={TYPE_OPTIONS}
        />

        <Select
          label="Category (optional)"
          value={form.category_id ?? ''}
          onChange={(e) => set('category_id', e.target.value ? Number(e.target.value) : null)}
          options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="No category"
        />

        <Input
          label="Amount"
          type="number"
          min="0"
          step="0.01"
          value={form.amount || ''}
          onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
          error={errors.amount}
          placeholder="0.00"
        />

        <Input
          label="Description"
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder="e.g. Invoice #1234"
        />

        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          error={errors.date}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            placeholder="Optional notes…"
          />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{transaction ? 'Save Changes' : 'Add Transaction'}</Button>
        </div>
      </div>
    </Modal>
  )
}
