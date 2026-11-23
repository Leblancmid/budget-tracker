import { useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, CircleHelp, Users, XCircle } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import { businessInsightsApi } from '@/api/business'
import type { PriceGuide } from '@/types'
import { checkBuy, type BuyVerdict } from '@/utils/buyCheck'
import { formatCurrency } from '@/utils/format'
import { formatGoldShort } from '@/utils/priceGuide'

const VERDICT: Record<BuyVerdict, { title: string; tone: string; Icon: typeof CheckCircle2 }> = {
  good:    { title: 'Good buy', tone: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-200', Icon: CheckCircle2 },
  tight:   { title: 'Tight: a thin margin', tone: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-200', Icon: CircleAlert },
  bad:     { title: 'Overpriced: similar ones sold for less', tone: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-200', Icon: XCircle },
  unknown: { title: 'Not enough to judge', tone: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200', Icon: CircleHelp },
}

const BUILD_LABEL = { melee: 'Melee', distance: 'Dist', magic: 'Magic' } as const

/**
 * Quick add's "check 650 melee 3500": should you buy this account at that price? From your own
 * sales: what similar ones sold for, the most to pay for your usual margin, how fast they sold, and
 * how many regulars bought one like it. Nothing is saved.
 */
export function BuyCheckPreview({ level, build, askPhp, askGold }: {
  level: number
  build: 'melee' | 'distance' | 'magic'
  askPhp: number | null
  askGold: number | null
}) {
  const [guide, setGuide] = useState<PriceGuide | null>(null)
  const [failed, setFailed] = useState(false)
  const key = `${level}-${build}`
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  // Ask again when the level or build changes (the price is judged here, no request needed)
  useEffect(() => {
    let live = true
    const t = setTimeout(() => {
      businessInsightsApi.priceGuide({ level, class: build })
        .then((g) => { if (live) { setGuide(g); setFailed(false); setLoadedKey(key) } })
        .catch(() => { if (live) setFailed(true) })
    }, 250)
    return () => { live = false; clearTimeout(t) }
  }, [level, build, key])

  const title = `Lv ${level} ${BUILD_LABEL[build]}`
  if (failed) return <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">Couldn't load your price guide.</p>
  if (!guide || loadedKey !== key) return <div className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />

  const a = guide.account
  const c = checkBuy(a, askPhp, askGold)
  const fmt = (n: number) => (c.unit === 'gold' ? formatGoldShort(n) : formatCurrency(n))
  const v = VERDICT[askPhp == null && askGold == null ? 'unknown' : c.verdict]

  return (
    <div className={`flex flex-col gap-2 rounded-xl border px-3 py-3 ${v.tone}`}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <v.Icon size={16} className="shrink-0" />
        {title}{(askPhp != null || askGold != null) && <> for <Amt value={fmt((askGold ?? askPhp)!)} /></>}: {v.title}
      </p>
      {c.typical == null ? (
        <p className="text-xs">No similar {BUILD_LABEL[build]} sales near level {level} yet, so there's nothing to compare with.</p>
      ) : (
        <ul className="flex flex-col gap-0.5 text-xs">
          <li>Similar ones sold for <b><Amt value={fmt(c.typical)} /></b>{a.level_range != null && <> (within {a.level_range} levels, {a.comparables.length} sale{a.comparables.length === 1 ? '' : 's'})</>}.</li>
          {c.maxBuy != null && (
            <li>
              Pay up to <b><Amt value={fmt(c.maxBuy)} /></b> to keep {c.assumedMargin ? `a ${c.margin}% margin` : `your usual ${c.margin}% margin`}
              {c.assumedMargin && <span className="opacity-75"> (your usual margin isn't known yet: record costs on sales)</span>}.
            </li>
          )}
          {c.profit != null && (
            <li>Likely profit: <b className={c.profit < 0 ? 'text-red-700 dark:text-red-300' : ''}>{c.profit < 0 && '−'}<Amt value={fmt(Math.abs(c.profit))} /></b>{askPhp == null && askGold == null && ' (add the asking price)'}</li>
          )}
          {a.days_to_sell != null && <li>Similar ones took about <b>{Math.round(a.days_to_sell)} days</b> to sell.</li>}
        </ul>
      )}
      {guide.regulars != null && guide.regulars > 0 && (
        <p className="flex items-center gap-1.5 text-xs font-semibold"><Users size={12} /> {guide.regulars} regular{guide.regulars === 1 ? '' : 's'} bought one like it: message them first when you list it.</p>
      )}
      {askPhp == null && askGold == null && <p className="text-[11px] opacity-80">Add the asking price to get a verdict, e.g. 3500 or 1.2kkk.</p>}
    </div>
  )
}
