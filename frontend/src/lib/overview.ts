import { formatCurrency } from '@/utils/format'
import type { MasterTrendMonth } from '@/types'
import { MONTHS } from '@/utils/format'
import { goldToPhp } from './goldRates'

/** Master → Overview: what the numbers mean, in one place (the page and its charts use these). */

export interface Rates {
  /** $ per 1M G */
  usdRate: number
  /** ₱ per $ */
  phpRate: number
}

export type HoldingKey = 'php' | 'usd' | 'gold' | 'accounts'

/**
 * What net worth is made of, in a fixed order (it decides the colours too). Colours are validated
 * for light and dark surfaces: the -600 steps on white, sky/amber/teal-600 and violet-500 on dark.
 */
export const HOLDINGS: { key: HoldingKey; label: string; fill: string; stroke: string; dot: string }[] = [
  { key: 'php',      label: 'PHP balance',     fill: 'fill-violet-600 dark:fill-violet-500', stroke: 'stroke-violet-600 dark:stroke-violet-500', dot: 'bg-violet-600 dark:bg-violet-500' },
  { key: 'usd',      label: 'USD balance',     fill: 'fill-sky-600',                         stroke: 'stroke-sky-600',                           dot: 'bg-sky-600' },
  { key: 'gold',     label: 'Gold stash',      fill: 'fill-amber-600',                       stroke: 'stroke-amber-600',                         dot: 'bg-amber-600' },
  { key: 'accounts', label: 'Listed accounts', fill: 'fill-teal-600',                        stroke: 'stroke-teal-600',                          dot: 'bg-teal-600' },
]

/** Monthly profit: Business (sold) and the Daily net. Validated as a pair on both surfaces. */
export const PROFIT_SERIES = {
  business: { label: 'Business (sold)', fill: 'fill-teal-600', dot: 'bg-teal-600' },
  daily:    { label: 'Daily net',       fill: 'fill-indigo-600 dark:fill-indigo-500', dot: 'bg-indigo-600 dark:bg-indigo-500' },
}

/** Each part of a month's net worth in ₱, gold and dollars valued at these rates. */
export function holdingsOf(m: MasterTrendMonth, r: Rates): Record<HoldingKey, number> {
  return {
    php: m.php_balance,
    usd: m.usd_balance * r.phpRate,
    gold: goldToPhp(m.gold_stash, r.usdRate, r.phpRate),
    accounts: goldToPhp(m.account_gold, r.usdRate, r.phpRate) + m.account_cash_php,
  }
}

export const netWorthOf = (m: MasterTrendMonth, r: Rates) => Object.values(holdingsOf(m, r)).reduce((s, v) => s + v, 0)

/** A month's profit: Business (sold) plus the Daily net, like the Overview's profit figures. */
export function profitOf(m: MasterTrendMonth): { business: number; daily: number; total: number } {
  const daily = m.daily_income - m.daily_expense
  return { business: m.business_profit, daily, total: m.business_profit + daily }
}

const HELD: (keyof MasterTrendMonth)[] = ['php_balance', 'usd_balance', 'gold_stash', 'account_gold', 'account_cash_php']

/**
 * Drop the quiet months at the start (before records began), keeping one month before the first
 * change as the starting point, and at least the last two months.
 */
export function fromFirstActivity(months: MasterTrendMonth[]): MasterTrendMonth[] {
  const first = months.findIndex((m, i) =>
    m.business_profit !== 0 || m.daily_income !== 0 || m.daily_expense !== 0
    || (i > 0 && HELD.some((k) => m[k] !== months[i - 1][k])))
  if (first === -1) return months.slice(-2)
  return months.slice(Math.min(Math.max(0, first - 1), Math.max(0, months.length - 2)))
}

/** "2026-11" → "Nov" (short) or "Nov 2026" */
export function monthLabel(ym: string, long = false): string {
  const [y, m] = ym.split('-').map(Number)
  return long ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1].slice(0, 3)
}

/** Compact ₱ for axes and tight spots: ₱950, ₱12.5k, ₱584k, ₱1.25M (sign kept). */
export function compactPhp(n: number): string {
  const a = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (a >= 1e6) return `${sign}₱${+(a / 1e6).toFixed(2)}M`
  if (a >= 1e5) return `${sign}₱${Math.round(a / 1e3)}k`
  if (a >= 1e3) return `${sign}₱${+(a / 1e3).toFixed(1)}k`
  return `${sign}₱${Math.round(a)}`
}

/** Round axis ticks covering [min, max] (always including 0), about `count` of them. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  const lo = Math.min(0, min)
  const hi = Math.max(0, max)
  if (hi === lo) return [0]
  const raw = (hi - lo) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = ([1, 2, 2.5, 5, 10].find((s) => s * mag >= raw) ?? 10) * mag
  const ticks: number[] = []
  for (let v = Math.floor(lo / step) * step; v <= hi + step * 1e-9; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  if (ticks[ticks.length - 1] < hi) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

/** Change from `before` to `now`: the amount, and the % when `before` isn't zero. */
export function change(now: number, before: number): { amount: number; pct: number | null } {
  return { amount: now - before, pct: before !== 0 ? ((now - before) / Math.abs(before)) * 100 : null }
}

/** '+₱1,200.00' / '−₱300.00' */
export const fmtSigned = (n: number) => `${n < 0 ? '−' : '+'}${formatCurrency(Math.abs(n))}`

/** Green for gains, red for losses */
export const tone = (n: number) => (n >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')
