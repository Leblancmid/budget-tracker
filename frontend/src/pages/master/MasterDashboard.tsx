import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { useMasterDashboard } from '@/hooks/useMasterDashboard'
import { useAmountVisibility } from '@/context/amountVisibility'
import { Card } from '@/components/ui/Card'
import { Amt } from '@/components/ui/Amt'
import { Legend } from '@/components/charts/chartKit'
import { StackedAreaChart } from '@/components/charts/StackedAreaChart'
import { ProfitBarChart } from '@/components/charts/ProfitBarChart'
import { Donut, Sparkline } from '@/components/charts/Donut'
import { change, compactPhp, fromFirstActivity, HOLDINGS, holdingsOf, monthLabel, netWorthOf, PROFIT_SERIES, profitOf, type HoldingKey, type Rates, fmtSigned, tone } from '@/lib/overview'
import { savedGoldRates } from '@/lib/goldRates'
import { formatGoldShort } from '@/utils/listing'
import { STORAGE_KEYS, writeString, type StorageKey } from '@/lib/storage'
import type { MasterDashboardStats, MasterTrendMonth } from '@/types'
import { OwnOverview } from './OwnOverview'
import { ChartCard, Delta, Stat } from './overviewParts'

const fmtUsd = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/**
 * Master File → Overview: everything at a glance. Four headline numbers, net worth over the year
 * and where it sits, profit by month and this month against last.
 */
export default function MasterDashboard() {
  const { stats, loading, trend: lastYear, trendLoading, trendError } = useMasterDashboard()
  const { hidden } = useAmountVisibility()
  const [rates, setRates] = useState<Rates>(() => savedGoldRates())

  if (loading) return <Skeleton />
  // Not an admin: the server sends only their own figures, shown on their own page
  if (stats?.scope === 'own') return <OwnOverview stats={stats} months={lastYear} loading={trendLoading} error={trendError} />

  // The last 12 months, from just before your records begin
  const trend = fromFirstActivity(lastYear)

  // Today, from the live totals (the headline); history from the month-by-month trend
  const now = currentHoldings(stats, rates)
  const netWorth = Object.values(now).reduce((s, v) => s + v, 0)
  const hasTrend = trend.length > 1
  const prev = hasTrend ? trend[trend.length - 2] : null
  const cur = hasTrend ? trend[trend.length - 1] : null
  const worthSeries = trend.map((m) => netWorthOf(m, rates))
  const curProfit = cur ? profitOf(cur) : { business: stats?.monthly_business_profit ?? 0, daily: stats?.monthly_daily_net ?? 0, total: stats?.monthly_profit ?? 0 }
  const prevProfit = prev ? profitOf(prev) : null
  const year = cur?.month.slice(0, 4) ?? String(new Date().getFullYear())
  const yearMonths = trend.filter((m) => m.month.startsWith(year))
  const yearProfit = yearMonths.reduce((s, m) => s + profitOf(m).total, 0)

  // Amounts on axes and in tooltips follow the Visible / Hidden switch
  const short = (v: number) => (hidden ? '' : compactPhp(v))
  const full = (v: number) => (hidden ? '••••••' : fmtSigned(v).replace(/^\+/, ''))
  const labels = trend.map((m) => monthLabel(m.month))
  const titles = trend.map((m) => monthLabel(m.month, true))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Overview</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">Everything you own and earn, at a glance</p>
        </div>
        <RateInputs rates={rates} onChange={setRates} />
      </div>

      {/* ── Headline numbers ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Net worth" value={formatCurrency(netWorth)} valueClass="text-gray-900 dark:text-gray-50"
          aside={worthSeries.length > 1 ? <Sparkline values={[...worthSeries.slice(0, -1), netWorth]} className="stroke-violet-600 dark:stroke-violet-400" /> : null}>
          {prev ? <Delta {...change(netWorth, netWorthOf(prev, rates))} since={`since end of ${monthLabel(prev.month)}`} /> : <span>≈ <Amt value={fmtUsd(netWorth / rates.phpRate)} /></span>}
        </Stat>
        <Stat label={`Profit, ${cur ? monthLabel(cur.month, true) : 'this month'}`} value={fmtSigned(curProfit.total)} valueClass={tone(curProfit.total)}>
          {prevProfit ? <Delta {...change(curProfit.total, prevProfit.total)} since={`vs ${monthLabel(prev!.month)} (${hidden ? '•••' : compactPhp(prevProfit.total)})`} /> : null}
        </Stat>
        <Stat label={`Profit, ${year} so far`} value={fmtSigned(yearProfit)} valueClass={tone(yearProfit)}>
          {yearMonths.length > 0 && <span>≈ <Amt value={compactPhp(yearProfit / yearMonths.length)} /> a month over {yearMonths.length} month{yearMonths.length === 1 ? '' : 's'}</span>}
        </Stat>
        <Stat label="Profit, all time" value={fmtSigned(stats?.overall_profit ?? 0)} valueClass={tone(stats?.overall_profit ?? 0)}>
          <span>Business <Amt value={compactPhp(stats?.business_profit ?? 0)} /> · Daily <Amt value={compactPhp(stats?.daily_net ?? 0)} /></span>
        </Stat>
      </div>

      {/* ── Net worth over time | where it is ────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Net worth by month"
          note="Gold and dollars at today's rates. Past months are rebuilt from your records."
          legend={<Legend items={[...HOLDINGS].reverse().map((h) => ({ label: h.label, dot: h.dot })).concat({ label: 'Net worth', dot: 'bg-gray-800 dark:bg-gray-100' })} />}
          loading={trendLoading} error={trendError}>
          <StackedAreaChart labels={labels} titles={titles} formatShort={short} formatFull={full} totalLabel="Net worth"
            series={HOLDINGS.map((h) => ({ ...h, values: trend.map((m) => holdingsOf(m, rates)[h.key]) }))} />
        </ChartCard>
        <Holdings stats={stats} now={now} netWorth={netWorth} rates={rates} />
      </div>

      {/* ── Profit by month | this month vs last ─────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Profit by month"
          note="Business is profit on what sold that month; Daily net is income minus expenses."
          legend={<Legend items={[
            { label: PROFIT_SERIES.business.label, dot: PROFIT_SERIES.business.dot },
            { label: PROFIT_SERIES.daily.label, dot: PROFIT_SERIES.daily.dot },
            { label: 'Total', mark: <span className="h-0.5 w-3 rounded bg-gray-800 dark:bg-gray-100" /> },
          ]} />}
          loading={trendLoading} error={trendError}>
          <ProfitBarChart labels={labels} titles={titles} formatShort={short} formatFull={full} highlight={trend.length - 1}
            series={[
              { key: 'business', ...PROFIT_SERIES.business, values: trend.map((m) => profitOf(m).business) },
              { key: 'daily', ...PROFIT_SERIES.daily, values: trend.map((m) => profitOf(m).daily) },
            ]} />
        </ChartCard>
        <MonthVsLast cur={cur} prev={prev} loading={trendLoading} />
      </div>
    </div>
  )
}

/** Today's holdings in ₱, from the live totals. */
function currentHoldings(stats: MasterDashboardStats | null, rates: Rates): Record<HoldingKey, number> {
  return holdingsOf({
    month: '', business_profit: 0, daily_income: 0, daily_expense: 0,
    php_balance: stats?.balance_php_total ?? 0, usd_balance: stats?.balance_usd_total ?? 0, gold_stash: stats?.gold_stash ?? 0,
    account_gold: stats?.total_price ?? 0, account_cash_php: stats?.accounts_cash_cost_php ?? 0,
  }, rates)
}

/** Where net worth sits: ring + one row per part, each linking to its page. */
function Holdings({ stats, now, netWorth, rates }: { stats: MasterDashboardStats | null; now: Record<HoldingKey, number>; netWorth: number; rates: Rates }) {
  const positive = HOLDINGS.reduce((s, h) => s + Math.max(0, now[h.key]), 0)
  const kks = stats?.kks_gold ?? 0
  const negative = HOLDINGS.filter((h) => now[h.key] < 0)
  const rows: Record<HoldingKey, { to: string; detail: string }> = {
    php: { to: '/master/balance', detail: `${stats?.balance_php_accounts ?? 0} wallets` },
    usd: { to: '/master/balance', detail: `${fmtUsd(stats?.balance_usd_total ?? 0)} in ${stats?.balance_usd_accounts ?? 0} wallets` },
    gold: { to: '/rucoy', detail: `${formatGoldShort(stats?.gold_stash ?? 0)} G` },
    accounts: {
      to: '/business/transactions',
      detail: `${stats?.account_count ?? 0} accounts · ${formatGoldShort(stats?.total_price ?? 0)} G${(stats?.accounts_cash_cost_php ?? 0) > 0 ? ` + ${compactPhp(stats!.accounts_cash_cost_php!)} cash` : ''}`,
    },
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Where it is</h2>
      <div className="flex items-center justify-center">
        <Donut label="Net worth by part" parts={HOLDINGS.map((h) => ({ key: h.key, value: now[h.key], stroke: h.stroke }))}>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Net worth</span>
          <span className="text-base font-bold text-gray-900 dark:text-gray-50"><Amt value={compactPhp(netWorth)} /></span>
          <span className="text-[10px] text-gray-400">≈ <Amt value={fmtUsd(netWorth / rates.phpRate)} /></span>
        </Donut>
      </div>
      <ul className="flex flex-col">
        {HOLDINGS.map((h) => {
          const v = now[h.key]
          const share = positive > 0 && v > 0 ? Math.round((v / positive) * 100) : null
          return (
            <li key={h.key}>
              <Link to={rows[h.key].to} className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <span className={['h-2.5 w-2.5 shrink-0 rounded-sm', h.dot].join(' ')} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">{h.label}</span>
                  <span className="block truncate text-[11px] text-gray-400 dark:text-gray-500"><Amt value={rows[h.key].detail} /></span>
                </span>
                <span className="text-right">
                  <span className={['block text-sm font-semibold tabular-nums', v < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'].join(' ')}>
                    <Amt value={`${v < 0 ? '−' : ''}${formatCurrency(Math.abs(v))}`} />
                  </span>
                  <span className="block text-[11px] text-gray-400">{share !== null ? `${share}%` : v < 0 ? 'negative' : '—'}</span>
                </span>
                <ArrowRight size={13} className="shrink-0 text-gray-300 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-300" />
              </Link>
            </li>
          )
        })}
      </ul>
      {(kks > 0 || negative.length > 0) && (
        <div className="flex flex-col gap-1 border-t border-gray-100 pt-3 text-[11px] text-gray-400 dark:border-gray-800 dark:text-gray-500">
          {kks > 0 && <p>Not counted: <Amt value={formatGoldShort(kks)} /> G in KKS trades.</p>}
          {negative.length > 0 && <p className="text-red-500">{negative.map((h) => h.label).join(' and ')} {negative.length === 1 ? 'is' : 'are'} negative and pull net worth down.</p>}
        </div>
      )}
    </Card>
  )
}

/** This month against last, line by line. */
function MonthVsLast({ cur, prev, loading }: { cur: MasterTrendMonth | null; prev: MasterTrendMonth | null; loading: boolean }) {
  const lines = cur && prev ? [
    { label: 'Business (sold)', now: cur.business_profit, before: prev.business_profit, good: 1 },
    { label: 'Daily income', now: cur.daily_income, before: prev.daily_income, good: 1 },
    { label: 'Daily expenses', now: cur.daily_expense, before: prev.daily_expense, good: -1 },
  ] : []
  const total = (m: MasterTrendMonth) => profitOf(m).total

  return (
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {cur && prev ? `${monthLabel(cur.month)} vs ${monthLabel(prev.month)}` : 'This month vs last'}
      </h2>
      {loading ? <div className="h-40 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        : !cur || !prev ? <p className="text-sm text-gray-400">Not enough history yet.</p>
        : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 dark:text-gray-500">
                <th className="pb-2 text-left font-medium" />
                <th className="pb-2 text-right font-medium">{monthLabel(cur.month)}</th>
                <th className="pb-2 text-right font-medium">{monthLabel(prev.month)}</th>
                <th className="pb-2 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {lines.map((l) => {
                const diff = l.now - l.before
                return (
                  <tr key={l.label} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-600 dark:text-gray-300">{l.label}</td>
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-gray-100"><Amt value={compactPhp(l.now)} /></td>
                    <td className="py-2 text-right text-gray-500 dark:text-gray-400"><Amt value={compactPhp(l.before)} /></td>
                    <td className={['py-2 text-right text-xs font-semibold', diff === 0 ? 'text-gray-400' : diff * l.good > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                      <Amt value={`${diff >= 0 ? '+' : '−'}${compactPhp(Math.abs(diff))}`} />
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                <td className="py-2 font-semibold text-gray-900 dark:text-gray-100">Profit</td>
                <td className={['py-2 text-right font-bold', tone(total(cur))].join(' ')}><Amt value={compactPhp(total(cur))} /></td>
                <td className="py-2 text-right text-gray-500 dark:text-gray-400"><Amt value={compactPhp(total(prev))} /></td>
                <td className={['py-2 text-right text-xs font-semibold', tone(total(cur) - total(prev))].join(' ')}>
                  <Amt value={`${total(cur) >= total(prev) ? '+' : '−'}${compactPhp(Math.abs(total(cur) - total(prev)))}`} />
                </td>
              </tr>
            </tbody>
          </table>
        )}
      <p className="mt-auto text-[11px] text-gray-400 dark:text-gray-500">
        Green means better for you: more earned, or less spent. {cur && 'This month is still going.'}
      </p>
    </Card>
  )
}

/** The two rates the page values gold and dollars at; saved for next time (and the sidebar). */
function RateInputs({ rates, onChange }: { rates: Rates; onChange: (r: Rates) => void }) {
  const [usd, setUsd] = useState(String(rates.usdRate))
  const [php, setPhp] = useState(String(rates.phpRate))
  const save = (key: StorageKey, raw: string, set: (s: string) => void, field: keyof Rates) => {
    set(raw)
    const n = parseFloat(raw)
    if (!isNaN(n) && n > 0) {
      writeString(key, String(n))
      onChange({ ...rates, [field]: n })
    }
  }
  const input = 'w-16 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400/40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px]"><ArrowLeftRight size={11} /> Rates</span>
      <label className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1 dark:border-gray-700">
        1KK G = $
        <input type="number" min="0.000001" step="0.01" value={usd} aria-label="Dollars per 1KK gold"
          onChange={(e) => save(STORAGE_KEYS.masterUsdRate, e.target.value, setUsd, 'usdRate')} className={input} />
      </label>
      <label className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1 dark:border-gray-700">
        1 USD = ₱
        <input type="number" min="0.01" step="0.01" value={php} aria-label="Pesos per dollar"
          onChange={(e) => save(STORAGE_KEYS.masterPhpRate, e.target.value, setPhp, 'phpRate')} className={input} />
      </label>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  )
}
