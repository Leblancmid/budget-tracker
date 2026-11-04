import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import { businessInsightsApi } from '@/api/business'
import { formatCurrency } from '@/utils/format'
import { formatGoldShort } from '@/utils/priceGuide'
import type { AccountClass, PriceComparable, PriceGuide } from '@/types'

const STAT_LABELS: [keyof Pick<PriceComparable, 'level' | 'melee' | 'distance' | 'magic' | 'defense'>, string][] = [
  ['level', 'Level'], ['melee', 'Melee'], ['distance', 'Distance'], ['magic', 'Magic'], ['defense', 'Defense'],
]

/**
 * Price guide from your own past sales: what similar accounts sold for and the most to pay
 * for one, or your recent gold rates and the highest buy rate that keeps your usual spread.
 */
export function PriceGuidePanel({ kind, level, accountClass, excludeId }: {
  kind: 'account' | 'gold'
  level?: number | null
  accountClass?: AccountClass | null
  /** The account being edited, so it isn't compared with itself */
  excludeId?: number | null
}) {
  const [guide, setGuide]   = useState<PriceGuide | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen]     = useState(false)

  // Wait for typing to pause before asking again
  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      businessInsightsApi.priceGuide({ level: kind === 'account' ? level : null, class: kind === 'account' ? accountClass : null, exclude_id: excludeId })
        .then((g) => { if (!cancelled) { setGuide(g); setFailed(false) } })
        .catch(() => { if (!cancelled) setFailed(true) })
    }, 400)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [kind, level, accountClass, excludeId])

  const box = 'rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-xs text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-100'
  const head = <span className="flex items-center gap-1.5 font-semibold"><Lightbulb size={13} className="text-indigo-500" /> Price guide</span>

  if (failed) return null
  if (!guide) return <div className="h-12 animate-pulse rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30" />

  if (kind === 'gold') {
    const g = guide.gold
    if (!g.sales || g.recent_sell_rate == null) return null
    return (
      <div className={box}>
        {head}
        <p className="mt-1">
          You've been selling at <b>${g.recent_sell_rate}</b>/KK lately
          {g.buy_rate != null && <> and buying at <b>${g.buy_rate}</b></>}.
          {g.max_buy_rate != null && <> To keep your usual {g.usual_spread}% spread, buy at <b>${g.max_buy_rate}</b> or less.</>}
        </p>
        <p className="mt-0.5 text-[11px] text-indigo-700/70 dark:text-indigo-300/60">From your last {g.sales} gold sales{g.usual_margin != null && <> · usual margin {g.usual_margin}%</>}.</p>
      </div>
    )
  }

  const a = guide.account
  if (!level) {
    return (
      <div className={box}>
        {head}
        <p className="mt-1">Enter the Level (or a name like "Leblanc 640 Dist") to see what similar accounts sold for.</p>
      </div>
    )
  }
  if (a.comparables.length === 0) {
    return (
      <div className={box}>
        {head}
        <p className="mt-1">No sold {a.class ?? ''} accounts near level {level} yet, so there's nothing to compare with.</p>
      </div>
    )
  }

  const wide = (a.level_range ?? 0) > 20
  return (
    <div className={box}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {head}
          <p className="mt-1">
            Similar accounts sold for <b><Amt value={formatCurrency(a.price_php ?? 0)} /></b>
            {a.price_gold != null && <> ({formatGoldShort(a.price_gold)})</>}
            {a.days_to_sell != null && <> in about {Math.round(a.days_to_sell)} days</>}.
            {a.max_buy_php != null && <> Pay <b><Amt value={formatCurrency(a.max_buy_php)} /></b>{a.max_buy_gold != null && <> ({formatGoldShort(a.max_buy_gold)})</>} or less to keep your usual {a.usual_margin}% margin.</>}
          </p>
          {wide && <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">Only found sales within ±{a.level_range} levels, so treat this as rough.</p>}
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} title={open ? 'Hide the sales used' : 'Show the sales used'} aria-label={open ? 'Hide the sales used' : 'Show the sales used'}
          className="rounded-md p-1 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/40">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {open && (
        <ul className="mt-2 divide-y divide-indigo-100 border-t border-indigo-100 dark:divide-indigo-900/50 dark:border-indigo-900/50">
          {a.comparables.map((c) => (
            <li key={c.id} className="py-1.5">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate">{c.description ?? `Level ${c.level}`}</span>
                <span className="font-semibold"><Amt value={formatCurrency(c.price_php ?? 0)} /></span>
                <span className="w-20 text-right text-[11px] opacity-70">{c.days_to_sell != null ? `${Math.round(c.days_to_sell)}d to sell` : ''}</span>
              </div>
              {/* Its stats screen, to compare with the one you're pricing ("—" = not filled in) */}
              <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-indigo-700/80 dark:text-indigo-300/70">
                {STAT_LABELS.map(([key, label]) => (
                  <span key={key}>{label} <b className="font-semibold text-indigo-900 dark:text-indigo-100">{c[key] ?? '—'}</b></span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
