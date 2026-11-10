import { useEffect } from 'react'
import { Amt } from '@/components/ui/Amt'
import { BriefCard } from '@/components/brief/BriefCard'
import { businessInsightsApi } from '@/api/business'
import { useAsyncData } from '@/hooks/useAsyncData'
import { markBriefSeen } from '@/lib/briefSeen'
import { formatCurrency } from '@/utils/format'
import type { BusinessBrief } from '@/types'

const NO_BRIEF = null as BusinessBrief | null

/** The Business weekly brief (on Stats): last 7 days vs the week before, and what needs you. */
export function WeeklyBrief() {
  const { data: brief, loading, error, refetch } = useAsyncData(businessInsightsApi.brief, NO_BRIEF)

  // Reading it clears the "new brief" dot on Business
  useEffect(() => { if (brief) markBriefSeen(brief.week, 'business') }, [brief])

  const s = brief?.summary
  const diff = s ? s.profit - s.prev_profit : 0

  return (
    <BriefCard
      brief={brief}
      loading={loading}
      error={error}
      onRefresh={refetch}
      tiles={s ? [
        { label: 'Profit (7 days)', value: <Amt value={formatCurrency(s.profit)} />, sub: <><span className={diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>{diff >= 0 ? '▲' : '▼'} <Amt value={formatCurrency(Math.abs(diff))} /></span> vs last week</> },
        { label: 'Accounts sold', value: s.accounts_sold, sub: 'this week' },
        { label: 'Gold trades sold', value: s.gold_sold, sub: 'this week' },
        { label: 'Gold margin', value: s.gold_margin != null ? `${s.gold_margin}%` : '—', sub: s.usual_gold_margin != null ? `usual ${s.usual_gold_margin}%` : 'no gold sales yet' },
      ] : []}
    />
  )
}
