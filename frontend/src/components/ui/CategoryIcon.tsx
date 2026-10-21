import type { Category } from '@/types'
import { categoryIcon } from '@/utils/categoryIcons'

/** Coloured rounded tile with the category's icon. */
export function CategoryIcon({ category, size = 'md', className = '' }: {
  category: Pick<Category, 'color' | 'icon' | 'name'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const Icon = categoryIcon(category.icon)
  const box  = size === 'sm' ? 'h-7 w-7 rounded-lg' : size === 'lg' ? 'h-11 w-11 rounded-xl' : 'h-9 w-9 rounded-xl'
  const icon = size === 'sm' ? 13 : size === 'lg' ? 20 : 16
  return (
    <span
      className={['flex shrink-0 items-center justify-center text-white shadow-sm', box, className].join(' ')}
      style={{ backgroundColor: category.color }}
      title={category.name}
    >
      <Icon size={icon} />
    </span>
  )
}
