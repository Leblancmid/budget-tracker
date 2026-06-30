import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { COLOR_OPTIONS } from '@/utils/format'
import type { Category } from '@/types'

interface CategoryModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CategoryFormData) => Promise<void>
  category?: Category | null
}

export interface CategoryFormData {
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
}

const ICONS = ['tag', 'shopping-cart', 'home', 'car', 'utensils', 'heart-pulse', 'graduation-cap', 'plane', 'tv', 'dumbbell', 'shirt', 'piggy-bank', 'briefcase', 'gift', 'music', 'coffee']

const EMPTY: CategoryFormData = { name: '', type: 'expense', color: '#6366f1', icon: 'tag' }

export function CategoryModal({ open, onClose, onSubmit, category }: CategoryModalProps) {
  const [form, setForm] = useState<CategoryFormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      setForm(category ? { name: category.name, type: category.type, color: category.color, icon: category.icon } : EMPTY)
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

  const set = <K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  return (
    <Modal open={open} onClose={onClose} title={category ? 'Edit Category' : 'New Category'}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set('type', t)}
              className={[
                'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors capitalize',
                form.type === t
                  ? t === 'income'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700'
                    : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="e.g. Groceries" />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                style={{ backgroundColor: c }}
                className={['h-7 w-7 rounded-full transition-transform hover:scale-110', form.color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 dark:ring-offset-gray-900' : ''].join(' ')}
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
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700'
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
