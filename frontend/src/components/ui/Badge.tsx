import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'income' | 'expense' | 'neutral'
  className?: string
}

const variants = {
  income:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  expense: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className].join(' ')}>
      {children}
    </span>
  )
}
