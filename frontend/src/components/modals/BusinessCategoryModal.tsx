import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { COLOR_OPTIONS } from '@/utils/format'
import type { BusinessCategory, BusinessTransactionType } from '@/types'

interface BusinessCategoryModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: BusinessCategoryFormData) => Promise<void>
  category?: BusinessCategory | null
}

export interface BusinessCategoryFormData {
  name: string
  type: BusinessTransactionType
  color: string
  icon: string
}

const ICONS = ['tag', 'briefcase', 'trending-up', 'shopping-cart', 'coins', 'wallet', 'receipt', 'building', 'users', 'star']

const EMPTY: BusinessCategoryFormData = { name: '', type: 'account', color: '#14b8a6', icon: 'briefcase' }

const TYPE_LABELS: Record<BusinessTransactionType, string> = {
  account: 'Account',
  gold: 'Gold',
  expense: 'Expense',
}

export function BusinessCategoryModal({ open, onClose, onSubmit, category }: BusinessCategoryModalProps) {
  const [form, setForm] = useState<BusinessCategoryFormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessCategoryFormData, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      setForm(
        category
          ? { name: category.name, type: category.type, color: category.color, icon: category.icon }
          : EMPTY
      )
    }
  }, [open, category])

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
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

  const set = <K extends keyof BusinessCategoryFormData>(key: K, value: BusinessCategoryFormData[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  return (
    <Modal open={open} onClose={onClose} title={category ? 'Edit Category' : 'New Business Category'}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {(['account', 'gold', 'expense'] as BusinessTransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set('type', t)}
              className={[
                'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                form.type === t
                  ? t === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
                    : 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="e.g. Sales Revenue" />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                style={{ backgroundColor: c }}
                className={['h-7 w-7 rounded-full transition-transform hover:scale-110', form.color === c ? 'ring-2 ring-offset-2 ring-teal-500 scale-110 dark:ring-offset-gray-900' : ''].join(' ')}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => set('icon', ic)}
                className={[
                  'rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors',
                  form.icon === ic
                    ? 'border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{category ? 'Save Changes' : 'Create Category'}</Button>
        </div>
      </div>
    </Modal>
  )
}
