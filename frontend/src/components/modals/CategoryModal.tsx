import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { flattenApiErrors } from '@/utils/api'
import { CATEGORY_COLORS, CATEGORY_ICONS, categoryIcon } from '@/utils/categoryIcons'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import type { Category } from '@/types'

interface CategoryModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CategoryFormData) => Promise<void>
  category?: Category | null
  /** Pre-select a type for new categories */
  defaultType?: 'income' | 'expense'
}

export interface CategoryFormData {
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
}

export function CategoryModal({ open, onClose, onSubmit, category, defaultType = 'expense' }: CategoryModalProps) {
  const [form, setForm] = useState<CategoryFormData>({ name: '', type: defaultType, color: '#6366f1', icon: 'tag' })
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      setForm(category
        ? { name: category.name, type: category.type, color: category.color, icon: category.icon }
        : { name: '', type: defaultType, color: '#6366f1', icon: 'tag' })
    }
  }, [open, category, defaultType])

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
      await onSubmit({ ...form, name: form.name.trim() })
      onClose()
    } catch (err: unknown) {
      const flat = flattenApiErrors(err)
      if (flat) setErrors(flat)
    } finally {
      setLoading(false)
    }
  }

  const set = <K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  // The stored icon may be in another casing (e.g. "Briefcase"); compare by the resolved icon
  const selectedIcon = categoryIcon(form.icon)

  return (
    <Modal open={open} onClose={onClose} title={category ? 'Edit Category' : 'New Category'} size="lg">
      <div className="flex flex-col gap-5">

        {/* Live preview */}
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
          <CategoryIcon category={{ ...form, name: form.name || 'Category' }} size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{form.name.trim() || 'Category name'}</p>
            <p className={['text-xs font-medium', form.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
              {form.type === 'income' ? 'Income category' : 'Expense category'}
            </p>
          </div>
        </div>

        {/* Type */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set('type', t)}
              className={[
                'flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all',
                form.type === t
                  ? t === 'income'
                    ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-900 dark:text-emerald-400'
                    : 'bg-white text-red-600 shadow-sm dark:bg-gray-900 dark:text-red-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              ].join(' ')}
            >
              {t === 'income' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
              {t === 'income' ? 'Income' : 'Expense'}
            </button>
          ))}
        </div>
        {category && category.type !== form.type && (category.transactions_count ?? 0) > 0 && (
          <p className="-mt-3 text-xs text-amber-600 dark:text-amber-400">
            Its {category.transactions_count} existing transactions keep their own income/expense type.
          </p>
        )}

        <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="e.g. Groceries" autoFocus />

        {/* Colour */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Colour</p>
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                style={{ backgroundColor: c }}
                className={['h-7 w-7 rounded-full transition-transform hover:scale-110', form.color.toLowerCase() === c ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-900 scale-110' : ''].join(' ')}
              />
            ))}
            <label title="Custom colour"
              className="relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-[10px] font-bold text-gray-400">
              +
              <input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
          </div>
        </div>

        {/* Icon */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Icon</p>
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 max-h-52 overflow-y-auto scrollbar-thin pr-1">
            {Object.entries(CATEGORY_ICONS).map(([key, { label, Icon }]) => {
              const selected = Icon === selectedIcon
              return (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => set('icon', key)}
                  className={[
                    'flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] font-medium transition-colors',
                    selected ? 'border-transparent text-white shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800',
                  ].join(' ')}
                  style={selected ? { backgroundColor: form.color } : undefined}
                >
                  <Icon size={16} />
                  <span className="truncate max-w-full px-0.5">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{category ? 'Save Changes' : 'Create Category'}</Button>
        </div>
      </div>
    </Modal>
  )
}
