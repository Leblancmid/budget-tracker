import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'income' | 'expense' | 'neutral'
  className?: string
}

const variants = {
  income:  'bg-emerald-100 text-emerald-700',
  expense: 'bg-red-100 text-red-700',
  neutral: 'bg-gray-100 text-gray-700',
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className].join(' ')}>
      {children}
    </span>
  )
}
