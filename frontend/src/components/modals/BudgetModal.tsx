import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { MONTHS, formatWithCommas, handleAmountInput, buildYearOptions } from '@/utils/format'
import { flattenApiErrors } from '@/utils/api'
import type { Budget, Category } from '@/types'

interface BudgetModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: BudgetFormData) => Promise<void>
  categories: Category[]
  budget?: Budget | null
  currentMonth: number
  currentYear: number
}

export interface BudgetFormData {
  category_id: number
  amount: number
  month: number
  year: number
}

export function BudgetModal({ open, onClose, onSubmit, categories, budget, currentMonth, currentYear }: BudgetModalProps) {
  const [form, setForm] = useState<BudgetFormData>({ category_id: 0, amount: 0, month: currentMonth, year: currentYear })
  const [amountStr, setAmountStr] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof BudgetFormData, string>>>({})
  const [loading, setLoading] = useState(false)

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  useEffect(() => {
    if (open) {
      setErrors({})
      if (budget) {
        const amt = parseFloat(budget.amount)
        setAmountStr(String(amt))
        setForm({ category_id: budget.category_id, amount: amt, month: budget.month, year: budget.year })
      } else {
        setAmountStr('')
        setForm({ category_id: 0, amount: 0, month: currentMonth, year: currentYear })
      }
    }
  }, [open, budget, currentMonth, currentYear])

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.category_id) errs.category_id = 'Category is required.'
    if (!form.amount || form.amount <= 0) errs.amount = 'Amount must be greater than 0.'
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
      else setErrors({ category_id: (err as { message?: string }).message ?? 'Something went wrong.' })
    } finally {
      setLoading(false)
    }
  }

  const set = <K extends keyof BudgetFormData>(key: K, value: BudgetFormData[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  const yearOptions = buildYearOptions(6)

  return (
    <Modal open={open} onClose={onClose} title={budget ? 'Edit Budget' : 'Set Budget'}>
      <div className="flex flex-col gap-4">
        {!budget && (
          <Select
            label="Category"
            placeholder="Select expense category"
            value={form.category_id || ''}
            onChange={(e) => set('category_id', Number(e.target.value))}
            options={expenseCategories.map((c) => ({ value: c.id, label: c.name }))}
            error={errors.category_id}
          />
        )}

        {budget && (
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Category: </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{budget.category?.name}</span>
          </div>
        )}

        <Input
          label="Budget Amount"
          type="text"
          inputMode="decimal"
          value={formatWithCommas(amountStr)}
          onChange={(e) => handleAmountInput(e.target.value, (s) => { setAmountStr(s); set('amount', parseFloat(s) || 0) })}
          error={errors.amount}
          placeholder="0.00"
        />

        {!budget && (
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Month"
              value={form.month}
              onChange={(e) => set('month', Number(e.target.value))}
              options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
            />
            <Select
              label="Year"
              value={form.year}
              onChange={(e) => set('year', Number(e.target.value))}
              options={yearOptions}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{budget ? 'Save Changes' : 'Set Budget'}</Button>
        </div>
      </div>
    </Modal>
  )
}
