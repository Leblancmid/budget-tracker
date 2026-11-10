import { useEffect } from 'react'
import { Amt } from '@/components/ui/Amt'
import { BriefCard } from '@/components/brief/BriefCard'
import { dashboardApi } from '@/api/dashboard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useDataChanged } from '@/lib/dataEvents'
import { markBriefSeen } from '@/lib/briefSeen'
import { formatCurrency } from '@/utils/format'
import type { DailyBrief as DailyBriefData } from '@/types'

const NO_BRIEF = null as DailyBriefData | null

/**
 * The Daily Expenses weekly brief (on the Dashboard): your last 7 days of spending against the
 * week before, budgets over or heading over, and things worth a look.
 */
export function DailyBrief() {
  const { data: brief, loading, error, refetch } = useAsyncData(dashboardApi.brief, NO_BRIEF)

  // Something logged with Quick add changes the numbers
  useDataChanged(() => { refetch() })

  // Reading it clears the "new brief" dot on Daily Expenses
  useEffect(() => { if (brief) markBriefSeen(brief.week, 'daily') }, [brief])

  const s = brief?.summary
  const diff = s ? s.spent - s.prev_spent : 0

  return (
    <BriefCard
      brief={brief}
      loading={loading}
      error={error}
      onRefresh={refetch}
      tiles={s ? [
        {
          label: 'Spent (7 days)',
          value: <Amt value={formatCurrency(s.spent)} />,
          // Spending less is the good direction here
          sub: <><span className={diff <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>{diff <= 0 ? '▼' : '▲'} <Amt value={formatCurrency(Math.abs(diff))} /></span> vs last week</>,
        },
        { label: 'Income (7 days)', value: <Amt value={formatCurrency(s.income)} />, sub: 'this week' },
        {
          label: 'Spent this month',
          value: <Amt value={formatCurrency(s.month_spent)} />,
          sub: s.month_budget != null ? <>of <Amt value={formatCurrency(s.month_budget)} /> budgeted</> : 'no budgets set',
        },
        {
          label: 'Safe per day',
          value: s.safe_per_day != null ? <Amt value={formatCurrency(s.safe_per_day)} /> : '—',
          sub: s.safe_per_day != null ? `for the ${s.days_left} day${s.days_left === 1 ? '' : 's'} left` : 'set budgets to see this',
        },
      ] : []}
    />
  )
}
