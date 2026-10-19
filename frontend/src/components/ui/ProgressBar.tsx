interface ProgressBarProps {
  /** 0–100 */
  percent: number
  /** Tailwind bg-* class for the filled part */
  color?: string
  className?: string
}

export function ProgressBar({ percent, color = 'bg-emerald-500', className = '' }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, percent))
  return (
    <div className={['h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/60', className].join(' ')}>
      <div className={['h-full rounded-full transition-all', pct >= 100 ? 'bg-emerald-500' : color].join(' ')} style={{ width: `${pct}%` }} />
    </div>
  )
}
