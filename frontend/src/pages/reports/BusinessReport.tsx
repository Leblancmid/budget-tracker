import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, BarChart3, ChevronLeft, ChevronRight, Coins, Download, Package, Percent, ShoppingBag, Trophy, TrendingDown, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useReport, type ReportPeriod, type ReportRow } from '@/hooks/useReport'
import { Card } from '@/components/ui/Card'
import { Amt } from '@/context/AmountVisibilityContext'
import { formatCurrency, MONTHS } from '@/utils/format'
import { exportCsv } from '@/utils/csv'

const PERIOD_TABS: { value: ReportPeriod; label: string; unit: string }[] = [
  { value: 'weekly',  label: 'Weekly',  unit: 'week'  },
  { value: 'monthly', label: 'Monthly', unit: 'month' },
  { value: 'yearly',  label: 'Yearly',  unit: 'year'  },
]

const TYPES: Record<string, { label: string; color: string; Icon: LucideIcon }> = {
  account: { label: 'Accounts', color: '#6366f1', Icon: User },
  gold:    { label: 'Gold',     color: '#f59e0b', Icon: Coins },
  expense: { label: 'Items',    color: '#ef4444', Icon: Package },
}
const typeOf = (t: string) => TYPES[t] ?? { label: t, color: '#14b8a6', Icon: ShoppingBag }

const now = new Date()
const profitOf = (r: ReportRow) => r.profit ?? r.income - r.expense

function shortLabel(row: ReportRow, period: ReportPeriod, i: number) {
  if (period === 'weekly')  return `W${i + 1}`
  if (period === 'monthly') return row.label.slice(0, 3)
  return row.label
}

function currentIndex(period: ReportPeriod, rows: ReportRow[], year: number, month: number) {
  if (period === 'monthly') return year === now.getFullYear() ? now.getMonth() : -1
  if (period === 'weekly')  return year === now.getFullYear() && month === now.getMonth() + 1 ? Math.min(Math.floor((now.getDate() - 1) / 7), rows.length - 1) : -1
  return rows.findIndex((r) => r.label === String(now.getFullYear()))
}

export default function BusinessReport() {
  const [period, setPeriod] = useState<ReportPeriod>('monthly')
  const [year,   setYear]   = useState(now.getFullYear())
  const [month,  setMonth]  = useState(now.getMonth() + 1)

  const { data, loading } = useReport('business', period, year, month)

  const rows    = data?.rows ?? []
  const income  = data?.totals.income ?? 0
  const cost    = data?.totals.expense ?? 0
  const profit  = data?.totals.profit ?? income - cost
  const unit    = PERIOD_TABS.find((p) => p.value === period)!.unit

  const active    = rows.filter((r) => r.income > 0 || r.expense > 0)
  const avgProfit = active.length ? profit / active.length : 0
  const margin    = income > 0 ? (profit / income) * 100 : null
  const best      = active.reduce<ReportRow | null>((b, r) => (!b || profitOf(r) > profitOf(b) ? r : b), null)
  const worst     = active.reduce<ReportRow | null>((w, r) => (!w || profitOf(r) < profitOf(w) ? r : w), null)
  const maxBar    = Math.max(1, ...rows.map((r) => Math.max(r.income, r.expense)))
  const curIdx    = currentIndex(period, rows, year, month)

  const running = useMemo(() => {
    let acc = 0
    return rows.map((r) => (acc += profitOf(r)))
  }, [rows])

  const types      = data?.types ?? []
  const typesTotal = types.reduce((s, t) => s + Math.max(0, t.profit), 0)

  const rangeLabel = period === 'weekly' ? `${MONTHS[month - 1]} ${year}` : period === 'monthly' ? String(year) : 'All years'

  const shiftRange = (delta: number) => {
    if (period === 'weekly') {
      const d = new Date(year, month - 1 + delta, 1)
      setMonth(d.getMonth() + 1); setYear(d.getFullYear())
    } else {
      setYear((y) => y + delta)
    }
  }

  const handleExport = () => {
    if (!rows.length) return
    exportCsv(`business-${period}-${period === 'weekly' ? `${year}-${month}` : year}`, rows.map((r, i) => ({
      period: r.label, revenue: r.income, cost: r.expense, profit: profitOf(r), running: running[i],
    })))
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Business report</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">Sold accounts and gold trades, counted in the period they were sold</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            {PERIOD_TABS.map(({ value, label }) => (
              <button key={value} onClick={() => setPeriod(value)}
                className={['rounded-lg px-3 py-1.5 text-sm font-semibold transition-all', period === value ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'].join(' ')}>
                {label}
              </button>
            ))}
          </div>
          {period !== 'yearly' && (
            <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
              <button onClick={() => shiftRange(-1)} className="flex h-9 w-9 items-center justify-center rounded-l-xl text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"><ChevronLeft size={16} /></button>
              <span className="min-w-[8.5rem] px-2 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">{rangeLabel}</span>
              <button onClick={() => shiftRange(1)} className="flex h-9 w-9 items-center justify-center rounded-r-xl text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"><ChevronRight size={16} /></button>
            </div>
          )}
          <button onClick={handleExport} disabled={!rows.length}
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="h-48 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-400/20">
                    <BarChart3 className="h-3.5 w-3.5 text-teal-300" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sold profit</span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">{rangeLabel}</span>
                </div>
                <p className={['text-4xl font-bold', profit >= 0 ? 'text-teal-200' : 'text-red-300'].join(' ')}>
                  {profit < 0 && '−'}<Amt value={formatCurrency(Math.abs(profit))} />
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {types.reduce((s, t) => s + t.count, 0)} sales across {active.length} {unit}{active.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="rounded-xl bg-white/5 px-3.5 py-2.5">
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><Percent size={11} /> Margin</p>
                  <p className="text-lg font-bold text-slate-100">{margin != null ? `${margin.toFixed(1)}%` : '—'}</p>
                </div>
                <div className="rounded-xl bg-white/5 px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Avg profit / {unit}</p>
                  <p className="text-lg font-bold text-teal-200"><Amt value={formatCurrency(avgProfit)} /></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/15"><ArrowDownLeft className="h-4 w-4 text-emerald-300" /></div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Revenue</p>
                  <p className="text-base font-bold text-emerald-400"><Amt value={formatCurrency(income)} /></p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-400/15"><ArrowUpRight className="h-4 w-4 text-red-300" /></div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cost</p>
                  <p className="text-base font-bold text-red-400"><Amt value={formatCurrency(cost)} /></p>
                </div>
              </div>
              {best && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><Trophy className="h-4 w-4 text-amber-300" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Best {unit}</p>
                    <p className="truncate text-sm font-bold text-slate-100">{best.label.replace(/ \(.*\)/, '')}</p>
                    <p className="text-[11px] text-teal-300"><Amt value={formatCurrency(profitOf(best))} /></p>
                  </div>
                </div>
              )}
              {worst && active.length > 1 && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><TrendingDown className="h-4 w-4 text-slate-300" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Slowest {unit}</p>
                    <p className="truncate text-sm font-bold text-slate-100">{worst.label.replace(/ \(.*\)/, '')}</p>
                    <p className={['text-[11px]', profitOf(worst) >= 0 ? 'text-slate-300' : 'text-red-300'].join(' ')}><Amt value={formatCurrency(profitOf(worst))} /></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Chart + by type ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue vs cost</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">By {unit} · profit shown above each bar</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Revenue</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" /> Cost</span>
            </div>
          </div>
          {loading ? (
            <div className="m-5 h-56 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">No sales in this range.</p>
          ) : (
            <div className="flex flex-col gap-2 p-5">
              <div className="flex h-56 items-end gap-1 sm:gap-2">
                {rows.map((r, i) => {
                  const p = profitOf(r)
                  const empty = r.income === 0 && r.expense === 0
                  return (
                    <div key={r.label} title={`${r.label}: revenue ${formatCurrency(r.income)}, cost ${formatCurrency(r.expense)}, profit ${formatCurrency(p)}`}
                      className={['group flex h-full flex-1 flex-col justify-end rounded-lg px-0.5 pb-0.5', i === curIdx ? 'bg-teal-50 dark:bg-teal-900/20' : ''].join(' ')}>
                      {!empty && (
                        <span className={['mb-1 text-center text-[9px] font-bold', p >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-500'].join(' ')}>
                          {p < 0 && '−'}{Math.abs(p) >= 1000 ? `${(Math.abs(p) / 1000).toFixed(0)}k` : Math.round(Math.abs(p))}
                        </span>
                      )}
                      <div className="flex flex-1 items-end justify-center gap-0.5">
                        {empty ? (
                          <span className="mb-0.5 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
                        ) : (
                          <>
                            <span className="w-1/2 max-w-[18px] rounded-t-md bg-emerald-500/90 group-hover:bg-emerald-500 transition-all duration-700" style={{ height: `${(r.income / maxBar) * 100}%` }} />
                            <span className="w-1/2 max-w-[18px] rounded-t-md bg-red-400/90 group-hover:bg-red-400 transition-all duration-700" style={{ height: `${(r.expense / maxBar) * 100}%` }} />
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-1 sm:gap-2">
                {rows.map((r, i) => (
                  <span key={r.label} className={['flex-1 text-center text-[10px] font-semibold', i === curIdx ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'].join(' ')}>
                    {shortLabel(r, period, i)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="flex flex-col">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Profit by type</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{rangeLabel}</p>
          </div>
          {loading ? (
            <div className="m-5 h-40 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />
          ) : types.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">Nothing sold in this range.</p>
          ) : (
            <div className="flex flex-col gap-4 p-5">
              {/* Stacked share bar */}
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                {types.filter((t) => t.profit > 0).map((t) => (
                  <div key={t.type} className="h-full" style={{ width: `${(t.profit / (typesTotal || 1)) * 100}%`, backgroundColor: typeOf(t.type).color }} />
                ))}
              </div>
              {types.map((t) => {
                const { label, color, Icon } = typeOf(t.type)
                const share = typesTotal > 0 ? Math.max(0, t.profit) / typesTotal : 0
                const m = t.income > 0 ? (t.profit / t.income) * 100 : null
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: color }}><Icon size={16} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</span>
                        <span className={['text-sm font-bold', t.profit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-500'].join(' ')}>
                          {t.profit < 0 && '−'}<Amt value={formatCurrency(Math.abs(t.profit))} />
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                        {t.count} sold · {Math.round(share * 100)}% of profit{m != null && ` · ${m.toFixed(1)}% margin`}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        <Amt value={formatCurrency(t.income)} /> revenue · <Amt value={formatCurrency(t.expense)} /> cost
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Breakdown table ────────────────────────────────────────── */}
      <Card className="flex flex-col">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Breakdown</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Running total adds each {unit}'s profit in order</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-700/60">
                {['Period', 'Revenue', 'Cost', 'Profit', 'Margin', 'Running'].map((h, i) => (
                  <th key={h} className={['px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400', i === 0 ? 'text-left' : 'text-right'].join(' ')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5"><div className={['h-3.5 rounded bg-gray-100 dark:bg-gray-800', j === 0 ? 'w-36' : 'w-20 ml-auto'].join(' ')} /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-gray-400 dark:text-gray-500">No sales in this range.</td></tr>
              ) : (
                rows.map((r, i) => {
                  const p = profitOf(r)
                  const empty = r.income === 0 && r.expense === 0
                  const m = r.income > 0 ? (p / r.income) * 100 : null
                  return (
                    <tr key={r.label} className={['transition-colors', i === curIdx ? 'bg-teal-50/60 dark:bg-teal-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30', empty ? 'opacity-50' : ''].join(' ')}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{r.label}</span>
                          {i === curIdx && <span className="rounded-full bg-teal-100 dark:bg-teal-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 dark:text-teal-300">current</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400"><Amt value={formatCurrency(r.income)} /></td>
                      <td className="px-5 py-3 text-right font-semibold text-red-500 dark:text-red-400"><Amt value={formatCurrency(r.expense)} /></td>
                      <td className={['px-5 py-3 text-right font-semibold', p >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                        {p < 0 && '−'}<Amt value={formatCurrency(Math.abs(p))} />
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">{m != null ? `${m.toFixed(1)}%` : '—'}</td>
                      <td className="px-5 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {running[i] < 0 && '−'}<Amt value={formatCurrency(Math.abs(running[i]))} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {!loading && rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 font-semibold">
                  <td className="px-5 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</td>
                  <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400"><Amt value={formatCurrency(income)} /></td>
                  <td className="px-5 py-3 text-right text-red-500 dark:text-red-400"><Amt value={formatCurrency(cost)} /></td>
                  <td className={['px-5 py-3 text-right', profit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                    {profit < 0 && '−'}<Amt value={formatCurrency(Math.abs(profit))} />
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-gray-500 dark:text-gray-400">{margin != null ? `${margin.toFixed(1)}%` : '—'}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  )
}
