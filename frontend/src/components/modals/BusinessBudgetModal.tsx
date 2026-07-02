import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { BusinessBudget, BusinessCategory } from '@/types'

interface BusinessBudgetModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { category_id: number; amount: number; month: number; year: number }) => Promise<void>
  categories: BusinessCategory[]
  budget?: BusinessBudget | null
  currentMonth: number
  currentYear: number
}

export function BusinessBudgetModal({ open, onClose, onSubmit, categories, budget, currentMonth, currentYear }: BusinessBudgetModalProps) {
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      if (budget) {
        setCategoryId(budget.category_id)
        setAmount(budget.amount)
      } else {
        setCategoryId('')
        setAmount('')
      }
    }
  }, [open, budget])

  const validate = () => {
    const errs: typeof errors = {}
    if (!budget && !categoryId) errs.category_id = 'Category is required.'
    if (!amount || parseFloat(amount) <= 0) errs.amount = 'Amount must be greater than 0.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({
        category_id: categoryId as number,
        amount: parseFloat(amount),
        month: currentMonth,
        year: currentYear,
      })
      onClose()
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]> }
      if (e.errors) setErrors(Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])))
    } finally {
      setLoading(false)
    }
  }

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  return (
    <Modal open={open} onClose={onClose} title={budget ? 'Edit Budget' : 'Set Business Budget'}>
      <div className="flex flex-col gap-4">
        {budget ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Editing budget for <span className="font-semibold">{budget.category.name}</span>
          </p>
        ) : (
          <Select
            label="Expense Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
            options={expenseCategories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select category"
            error={errors.category_id}
          />
        )}

        <Input
          label="Budget Amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          placeholder="0.00"
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{budget ? 'Save Changes' : 'Set Budget'}</Button>
        </div>
      </div>
    </Modal>
  )
}
