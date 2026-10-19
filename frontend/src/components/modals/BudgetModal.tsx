import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { MONTHS, formatCurrency, formatWithCommas, handleAmountInput } from '@/utils/format'
import { flattenApiErrors } from '@/utils/api'
import { CategoryIcon } from '@/utils/categoryIcons'
import { Amt } from '@/context/AmountVisibilityContext'
import type { Budget, Category } from '@/types'

interface BudgetModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: BudgetFormData) => Promise<void>
  /** Categories with month_total for the budget's month */
  categories: Category[]
  budget?: Budget | null
  currentMonth: number
  currentYear: number
  /** Expense categories that already have a budget this month */
  budgetedCategoryIds?: number[]
  /** Pre-select a category for a new budget */
  defaultCategoryId?: number | null
}

export interface BudgetFormData {
  category_id: number
  amount: number
  month: number
  year: number
}

export function BudgetModal({ open, onClose, onSubmit, categories, budget, currentMonth, currentYear, budgetedCategoryIds = [], defaultCategoryId }: BudgetModalProps) {
  const [form, setForm] = useState<BudgetFormData>({ category_id: 0, amount: 0, month: currentMonth, year: currentYear })
  const [amountStr, setAmountStr] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof BudgetFormData, string>>>({})
  const [loading, setLoading] = useState(false)

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  useEffect(() => {
    if (!open) return
    setErrors({})
    if (budget) {
      const amt = parseFloat(budget.amount)
      setAmountStr(String(amt))
      setForm({ category_id: budget.category_id, amount: amt, month: budget.month, year: budget.year })
    } else {
      setAmountStr('')
      setForm({ category_id: defaultCategoryId ?? 0, amount: 0, month: currentMonth, year: currentYear })
    }
  }, [open, budget, currentMonth, currentYear, defaultCategoryId])

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.category_id) errs.category_id = 'Pick a category.'
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

  const setAmount = (n: number) => { setAmountStr(String(n)); setForm((p) => ({ ...p, amount: n })); setErrors((e) => ({ ...e, amount: undefined })) }

  const selected = expenseCategories.find((c) => c.id === form.category_id) ?? budget?.category
  const spent    = (selected && 'month_total' in selected ? selected.month_total : undefined) ?? budget?.spent ?? 0
  // Quick picks: round current spending up to a tidy figure
  const roundUp  = (n: number, step: number) => Math.ceil(n / step) * step
  const quick    = spent > 0
    ? [...new Set([roundUp(spent, 500), roundUp(spent * 1.2, 500), roundUp(spent * 1.5, 1000)])]
    : [1000, 3000, 5000]

  return (
    <Modal open={open} onClose={onClose} title={budget ? `Edit ${budget.category?.name} Budget` : 'Set Budget'} size="lg">
      <div className="flex flex-col gap-5">
        <p className="-mt-1 text-xs text-gray-500 dark:text-gray-400">
          For <b className="text-gray-700 dark:text-gray-200">{MONTHS[(budget?.month ?? currentMonth) - 1]} {budget?.year ?? currentYear}</b> · only Personal expenses count toward it
        </p>

        {/* Category */}
        {!budget ? (
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Category</p>
            <div className="flex flex-wrap gap-1.5">
              {expenseCategories.map((c) => {
                const taken = budgetedCategoryIds.includes(c.id)
                const on = form.category_id === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={taken}
                    title={taken ? 'Already has a budget this month' : undefined}
                    onClick={() => { setForm((p) => ({ ...p, category_id: c.id })); setErrors((e) => ({ ...e, category_id: undefined })) }}
                    className={[
                      'flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs font-semibold transition-colors',
                      on ? 'border-transparent text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
                      taken ? 'opacity-40 cursor-not-allowed' : '',
                    ].join(' ')}
                    style={on ? { backgroundColor: c.color } : undefined}
                  >
                    <CategoryIcon category={c} size="sm" className="!h-5 !w-5 !rounded-full" />
                    {c.name}
                  </button>
                )
              })}
            </div>
            {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
            <CategoryIcon category={budget.category} />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{budget.category?.name}</span>
          </div>
        )}

        {/* Amount */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Monthly limit</p>
          <div className={['flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-colors', errors.amount ? 'border-red-400' : 'border-indigo-200 focus-within:border-indigo-400 dark:border-indigo-900/60'].join(' ')}>
            <span className="text-2xl font-bold text-indigo-500">₱</span>
            <input
              type="text"
              inputMode="decimal"
              autoFocus={!!budget}
              value={formatWithCommas(amountStr)}
              onChange={(e) => handleAmountInput(e.target.value, (s) => { setAmountStr(s); setForm((p) => ({ ...p, amount: parseFloat(s) || 0 })); setErrors((x) => ({ ...x, amount: undefined })) })}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-600"
            />
          </div>
          {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {quick.map((n) => (
              <button key={n} type="button" onClick={() => setAmount(n)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {formatCurrency(n)}
              </button>
            ))}
            {selected && (
              <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">
                Spent so far: <b className="text-gray-600 dark:text-gray-300"><Amt value={formatCurrency(spent)} /></b>
              </span>
            )}
          </div>
          {form.amount > 0 && spent > form.amount && (
            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
              You've already spent <Amt value={formatCurrency(spent)} /> — this budget will start over the limit.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{budget ? 'Save Changes' : 'Set Budget'}</Button>
        </div>
      </div>
    </Modal>
  )
}
