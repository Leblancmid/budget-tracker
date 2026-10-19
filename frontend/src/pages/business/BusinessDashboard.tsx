import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Briefcase, Coins, Hourglass, Package, Percent, ShoppingBag, TrendingDown, TrendingUp, User } from 'lucide-react'
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard'
import { Card } from '@/components/ui/Card'
import { MonthNav } from '@/components/ui/MonthNav'
import { formatCurrency, formatDate, MONTHS } from '@/utils/format'
import { Amt } from '@/context/AmountVisibilityContext'
import type { LucideIcon } from 'lucide-react'

const TYPES: Record<string, { label: string; color: string; Icon: LucideIcon }> = {
  account: { label: 'Accounts', color: '#6366f1', Icon: User },
  gold:    { label: 'Gold',     color: '#f59e0b', Icon: Coins },
  expense: { label: 'Items',    color: '#ef4444', Icon: Package },
}
const typeOf = (t: string) => TYPES[t] ?? { label: t, color: '#14b8a6', Icon: ShoppingBag }

function TypeIcon({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' }) {
  const { color, Icon } = typeOf(type)
  return (
    <span className={['flex shrink-0 items-center justify-center text-white shadow-sm', size === 'sm' ? 'h-7 w-7 rounded-lg' : 'h-9 w-9 rounded-xl'].join(' ')} style={{ backgroundColor: color }}>
      <Icon size={size === 'sm' ? 13 : 16} />
    </span>
  )
}

export default function BusinessDashboard() {
  const { stats, month, year, loading, setMonth, setYear } = useBusinessDashboard()
  const changeMonth = (m: number, y: number) => { setMonth(m); setYear(y) }

  const profit   = stats?.total_profit ?? 0
  const income   = stats?.archived_income ?? 0
  const cost     = stats?.archived_expense ?? 0
  const sold     = stats?.sold_count ?? 0
  const prev     = stats?.prev_profit ?? null
  const margin   = income > 0 ? (profit / income) * 100 : null
  const delta    = prev != null && prev !== 0 ? ((profit - prev) / Math.abs(prev)) * 100 : null
  const pipeline = stats?.pipeline
  const daily    = stats?.daily_business

  const trend    = stats?.realized_trend ?? []
  const trendMax = Math.max(1, ...trend.map((t) => Math.max(t.income, t.expense)))
  const yearProfit = trend.reduce((s, t) => s + t.profit, 0)
  const bestMonth  = trend.reduce<typeof trend[number] | null>((best, t) => (t.count > 0 && (!best || t.profit > best.profit) ? t : best), null)

  const byType = useMemo(() => (stats?.profit_by_type ?? []).map((t) => ({ ...t, total: Number(t.total) })), [stats])
  const byTypeTotal = byType.reduce((s, t) => s + Math.max(0, t.total), 0)

  const prevLabel = MONTHS[(month + 10) % 12]

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Business</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">Profit counts in the month an account or gold trade is sold</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthNav month={month} year={year} onChange={changeMonth} />
          <Link to="/business/transactions"
            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors">
            <ShoppingBag size={15} /> Sales
          </Link>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="h-48 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            {/* Sold this month */}
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-400/20">
                    <BarChart3 className="h-3.5 w-3.5 text-teal-300" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sold profit</span>
                  {delta != null && (
                    <span className={['inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', delta >= 0 ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'].join(' ')}
                      title={`vs ${prevLabel}`}>
                      {delta >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(delta) < 1 ? '<1' : Math.round(Math.abs(delta))}%
                    </span>
                  )}
                </div>
                <p className={['text-4xl font-bold', profit >= 0 ? 'text-teal-200' : 'text-red-300'].join(' ')}>
                  {profit < 0 && '−'}<Amt value={formatCurrency(Math.abs(profit))} />
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {sold} sale{sold !== 1 ? 's' : ''} in {MONTHS[month - 1]}
                  {prev != null && <> · {prevLabel}: <Amt value={formatCurrency(prev)} /></>}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Revenue</p>
                  <p className="text-base font-bold text-emerald-400"><Amt value={formatCurrency(income)} /></p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cost</p>
                  <p className="text-base font-bold text-red-400"><Amt value={formatCurrency(cost)} /></p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><Percent size={10} /> Margin</p>
                  <p className="text-base font-bold text-slate-100">{margin != null ? `${margin.toFixed(1)}%` : '—'}</p>
                </div>
              </div>
            </div>

            {/* Pipeline */}
            {pipeline && (
              <Link to="/business/transactions"
                className="flex flex-col justify-between gap-3 rounded-xl bg-white/5 hover:bg-white/10 px-4 py-4 transition-colors lg:min-w-[17rem]"
                title="Open Sales">
                <div className="flex items-center gap-2">
                  <Hourglass className="h-3.5 w-3.5 text-amber-300" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Unsold pipeline</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Potential profit</p>
                  <p className="text-2xl font-bold text-amber-200"><Amt value={formatCurrency(pipeline.profit)} /></p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pipeline.by_type.map((t) => {
                    const { label, Icon } = typeOf(t.type)
                    return (
                      <span key={t.type} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                        <Icon size={11} /> {t.count} {label.toLowerCase()}
                      </span>
                    )
                  })}
                  {pipeline.awaiting_pricing > 0 && (
                    <span className="inline-flex items-center rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                      {pipeline.awaiting_pricing} awaiting pricing
                    </span>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Year chart ─────────────────────────────────────────────── */}
      <Card className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{year} sold profit</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              <Amt value={formatCurrency(yearProfit)} /> so far
              {bestMonth && <> · best month {MONTHS[bestMonth.month - 1]} (<Amt value={formatCurrency(bestMonth.profit)} />)</>}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Revenue</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" /> Cost</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal-500" /> Profit</span>
          </div>
        </div>
        {loading ? (
          <div className="m-5 h-52 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />
        ) : (
          <div className="flex flex-col gap-2 p-5">
            <div className="flex h-52 items-end gap-1 sm:gap-2">
              {trend.map((t) => {
                const selected = t.month === month
                return (
                  <button
                    key={t.month}
                    onClick={() => changeMonth(t.month, year)}
                    title={`${MONTHS[t.month - 1]}: revenue ${formatCurrency(t.income)}, cost ${formatCurrency(t.expense)}, profit ${formatCurrency(t.profit)} · ${t.count} sold`}
                    className={['group relative flex h-full flex-1 flex-col justify-end rounded-lg px-0.5 pb-0.5 transition-colors', selected ? 'bg-teal-50 dark:bg-teal-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'].join(' ')}
                  >
                    {t.count > 0 && (
                      <span className={['mb-1 text-center text-[9px] font-bold', t.profit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-500'].join(' ')}>
                        {Math.abs(t.profit) >= 1000 ? `${(t.profit / 1000).toFixed(0)}k` : Math.round(t.profit)}
                      </span>
                    )}
                    <div className="flex flex-1 items-end justify-center gap-0.5">
                      {t.count === 0 ? (
                        <span className="mb-0.5 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
                      ) : (
                        <>
                          <span className="w-1/2 max-w-[16px] rounded-t-md bg-emerald-500/90 group-hover:bg-emerald-500 transition-all duration-700" style={{ height: `${(t.income / trendMax) * 100}%` }} />
                          <span className="w-1/2 max-w-[16px] rounded-t-md bg-red-400/90 group-hover:bg-red-400 transition-all duration-700" style={{ height: `${(t.expense / trendMax) * 100}%` }} />
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-1 sm:gap-2">
              {trend.map((t) => (
                <span key={t.month} className={['flex-1 text-center text-[10px] font-semibold', t.month === month ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'].join(' ')}>
                  {MONTHS[t.month - 1].slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── Breakdown + recently sold ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="flex flex-col">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Profit by type</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{MONTHS[month - 1]} {year}</p>
          </div>
          <div className="flex flex-col gap-4 p-5">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />)
            ) : byType.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">Nothing sold this month yet.</p>
            ) : (
              byType.map((t) => {
                const { label, color } = typeOf(t.type)
                const share = byTypeTotal > 0 ? Math.max(0, t.total) / byTypeTotal : 0
                const m = t.income && t.income > 0 ? (t.total / t.income) * 100 : null
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <TypeIcon type={t.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</span>
                        <span className={['text-sm font-bold', t.total >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-500'].join(' ')}>
                          {t.total < 0 && '−'}<Amt value={formatCurrency(Math.abs(t.total))} />
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${share * 100}%`, backgroundColor: color }} />
                      </div>
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                        {t.count ?? 0} sold · {Math.round(share * 100)}% of profit{m != null && ` · ${m.toFixed(1)}% margin`}
                      </p>
                    </div>
                  </div>
                )
              })
            )}

            {/* Business-tagged daily transactions */}
            {daily && daily.count > 0 && (
              <Link to="/transactions" className="mt-1 flex items-center gap-3 rounded-xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/60 dark:bg-teal-900/10 px-3.5 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300"><Briefcase size={15} /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-teal-800 dark:text-teal-200">Business daily transactions</p>
                  <p className="text-[11px] text-teal-700/70 dark:text-teal-300/70">{daily.count} this month · not in Sold profit above</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">+<Amt value={formatCurrency(daily.income)} /></p>
                  <p className="font-semibold text-red-500 dark:text-red-400">−<Amt value={formatCurrency(daily.expense)} /></p>
                </div>
              </Link>
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recently sold</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{MONTHS[month - 1]} {year}</p>
            </div>
            <Link to="/business/transactions" className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300">
              Sales <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                  <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-2.5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>
              ))
            ) : (stats?.recent_sold?.length ?? 0) === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">No sales in {MONTHS[month - 1]}.</p>
            ) : (
              stats!.recent_sold!.map((tx) => {
                const isItem = tx.type === 'expense'
                const p = isItem
                  ? -Number(tx.amount)
                  : tx.profit_php != null ? Number(tx.profit_php) : Number(tx.price_php ?? 0) - Number(tx.cost_php ?? 0)
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <TypeIcon type={tx.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{tx.description || typeOf(tx.type).label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {typeOf(tx.type).label} · sold {formatDate(tx.archived_at ?? tx.date)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={['text-sm font-bold', p >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                        {p >= 0 ? '+' : '−'}<Amt value={formatCurrency(Math.abs(p))} />
                      </p>
                      {!isItem && tx.price_php != null && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">of <Amt value={formatCurrency(tx.price_php)} /></p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
