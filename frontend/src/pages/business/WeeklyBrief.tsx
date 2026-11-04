import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, CircleAlert, Info, RefreshCw, Sparkles, ThumbsUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Amt } from '@/components/ui/Amt'
import { businessInsightsApi } from '@/api/business'
import { useAsyncData } from '@/hooks/useAsyncData'
import { markBriefSeen } from '@/lib/briefSeen'
import { formatCurrency, formatShortDate } from '@/utils/format'
import type { BriefInsight, BriefLevel, BusinessBrief } from '@/types'

const LEVELS: Record<BriefLevel, { Icon: LucideIcon; tile: string }> = {
  bad:  { Icon: CircleAlert,   tile: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  warn: { Icon: AlertTriangle, tile: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  good: { Icon: ThumbsUp,      tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  info: { Icon: Info,          tile: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
}

/** How many insights show before "Show more". */
const FIRST = 5

function InsightRow({ insight: i }: { insight: BriefInsight }) {
  const { Icon, tile } = LEVELS[i.level]
  const body = (
    <>
      <span className={['mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', tile].join(' ')}><Icon size={14} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">{i.title}</span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">{i.detail}</span>
      </span>
      {i.link && <ChevronRight size={16} className="mt-1.5 shrink-0 text-gray-300 group-hover:text-gray-500 dark:text-gray-600" />}
    </>
  )
  const cls = 'group flex items-start gap-3 px-5 py-3'
  return i.link
    ? <Link to={i.link} className={cls + ' hover:bg-gray-50 dark:hover:bg-gray-800/40'}>{body}</Link>
    : <div className={cls}>{body}</div>
}

const NO_BRIEF = null as BusinessBrief | null

/**
 * The weekly brief: last 7 days vs the week before, and what needs you. Built from plain
 * rules on your own numbers (free, no AI service).
 */
export function WeeklyBrief() {
  const { data: brief, loading, error, refetch } = useAsyncData(businessInsightsApi.brief, NO_BRIEF)
  const [showAll, setShowAll] = useState(false)

  // Reading it clears the "new brief" dot in the sidebar
  useEffect(() => { if (brief) markBriefSeen(brief.week) }, [brief])

  if (loading && !brief) return <div className="h-56 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />

  if (error || !brief) {
    return (
      <Card>
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Couldn't load the weekly brief.</p>
          <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      </Card>
    )
  }

  const s = brief.summary
  const diff = s.profit - s.prev_profit
  const shown = showAll ? brief.insights : brief.insights.slice(0, FIRST)
  const needsYou = brief.insights.filter((i) => i.level === 'bad' || i.level === 'warn').length

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-100 px-5 py-3.5 dark:border-gray-700/60">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"><Sparkles size={14} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Weekly brief</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {formatShortDate(brief.from)} – {formatShortDate(brief.to)} · {needsYou ? `${needsYou} thing${needsYou === 1 ? '' : 's'} need you` : 'Nothing needs you'}
          </p>
        </div>
        <button onClick={() => refetch()} title="Refresh" aria-label="Refresh the brief"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Numbers at a glance */}
      <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800 sm:grid-cols-4">
        {[
          { label: 'Profit (7 days)', value: <Amt value={formatCurrency(s.profit)} />, sub: <><span className={diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>{diff >= 0 ? '▲' : '▼'} <Amt value={formatCurrency(Math.abs(diff))} /></span> vs last week</> },
          { label: 'Accounts sold', value: s.accounts_sold, sub: 'this week' },
          { label: 'Gold trades sold', value: s.gold_sold, sub: 'this week' },
          { label: 'Gold margin', value: s.gold_margin != null ? `${s.gold_margin}%` : '—', sub: s.usual_gold_margin != null ? `usual ${s.usual_gold_margin}%` : 'no gold sales yet' },
        ].map((t) => (
          <div key={t.label} className="bg-white px-5 py-3 dark:bg-gray-900">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{t.label}</p>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{t.value}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{t.sub}</p>
          </div>
        ))}
      </div>

      {brief.insights.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400">All clear this week.</p>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {shown.map((i) => <InsightRow key={i.key} insight={i} />)}
        </div>
      )}
      {brief.insights.length > FIRST && (
        <button onClick={() => setShowAll((v) => !v)}
          className="w-full border-t border-gray-100 px-5 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700/60 dark:text-gray-400 dark:hover:bg-gray-800/40">
          {showAll ? 'Show less' : `Show ${brief.insights.length - FIRST} more`}
        </button>
      )}
    </Card>
  )
}
