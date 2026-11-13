import type { ReactNode } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Amt } from '@/components/ui/Amt'
import { compactPhp, tone } from '@/lib/overview'

/** Pieces shared by the Overview (whole business, for admins) and Your overview (everyone else). */

export function Stat({ label, value, valueClass, aside, children }: { label: string; value: string; valueClass: string; aside?: ReactNode; children?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className={['mt-1 truncate text-2xl font-bold tabular-nums', valueClass].join(' ')}><Amt value={value} /></p>
        </div>
        {aside}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{children}</div>
    </Card>
  )
}

/** "▲ ₱12.3k (2.1%) since end of Oct" */
export function Delta({ amount, pct, since }: { amount: number; pct: number | null; since: string }) {
  const up = amount >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className="flex flex-wrap items-center gap-x-1">
      <span className={['inline-flex items-center gap-1 font-semibold', tone(amount)].join(' ')}>
        {/* The % is hidden with the amounts: it shows how much the business moved */}
        <Icon size={12} /> <Amt value={`${up ? '+' : '−'}${compactPhp(Math.abs(amount))}`} />{pct !== null && <> (<Amt value={`${Math.abs(pct).toFixed(1)}%`} />)</>}
      </span>
      {since}
    </span>
  )
}

export function ChartCard({ title, note, legend, loading, error, className = '', children }: {
  title: string; note: string; legend: ReactNode; loading: boolean; error: string | null; className?: string; children: ReactNode
}) {
  return (
    <Card className={['flex flex-col gap-3 p-5', className].join(' ')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {legend}
      </div>
      {loading ? <div className="h-[220px] animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        : error ? <p className="flex h-[220px] items-center justify-center text-sm text-red-500">{error}</p>
        : children}
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{note}</p>
    </Card>
  )
}
