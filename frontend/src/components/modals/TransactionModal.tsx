import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Category, Transaction } from '@/types'

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TransactionFormData) => Promise<void>
  categories: Category[]
  transaction?: Transaction | null
}

export interface TransactionFormData {
  category_id: number
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  notes: string
}

const EMPTY: TransactionFormData = {
  category_id: 0,
  type: 'expense',
  amount: 0,
  description: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
}

export function TransactionModal({ open, onClose, onSubmit, categories, transaction }: TransactionModalProps) {
  const [form, setForm] = useState<TransactionFormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      setForm(
        transaction
          ? {
              category_id: transaction.category_id,
              type: transaction.type,
              amount: parseFloat(transaction.amount),
              description: transaction.description ?? '',
              date: transaction.date,
              notes: transaction.notes ?? '',
            }
          : EMPTY
      )
    }
  }, [open, transaction])

  const filteredCategories = categories.filter((c) => c.type === form.type)

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.category_id) errs.category_id = 'Category is required.'
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
      if (e.errors) {
        setErrors(Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])))
      }
    } finally {
      setLoading(false)
    }
  }

  const set = <K extends keyof TransactionFormData>(key: K, value: TransactionFormData[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  return (
    <Modal open={open} onClose={onClose} title={transaction ? 'Edit Transaction' : 'Add Transaction'}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { set('type', t); set('category_id', 0) }}
              className={[
                'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors capitalize',
                form.type === t
                  ? t === 'income'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        <Select
          label="Category"
          placeholder="Select category"
          value={form.category_id || ''}
          onChange={(e) => set('category_id', Number(e.target.value))}
          options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
          error={errors.category_id}
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
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional short description"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Additional notes (optional)"
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none scrollbar-thin"
          />
        </div>

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
