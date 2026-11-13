import { Link } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'
import { useAmountVisibility } from '@/context/amountVisibility'
import { Card } from '@/components/ui/Card'
import { Amt } from '@/components/ui/Amt'
import { Legend } from '@/components/charts/chartKit'
import { ProfitBarChart } from '@/components/charts/ProfitBarChart'
import { change, compactPhp, fromFirstActivity, monthLabel, PROFIT_SERIES, profitOf, fmtSigned, tone } from '@/lib/overview'
import { formatCurrency } from '@/utils/format'
import type { MasterDashboardStats, MasterTrendMonth } from '@/types'
import { ChartCard, Delta, Stat } from './overviewParts'

/**
 * Overview for someone who isn't an admin: only what's theirs, their own Daily Expenses and the
 * profit of the sales they made. The business's wallets, gold and listed accounts aren't shown.
 */
export function OwnOverview({ stats, months, loading, error }: {
  stats: MasterDashboardStats
  months: MasterTrendMonth[]
  loading: boolean
  error: string | null
}) {
  const { hidden } = useAmountVisibility()
  const trend = fromFirstActivity(months)
  const cur = trend.at(-1) ?? null
  const prev = trend.length > 1 ? trend[trend.length - 2] : null
  const curProfit = cur ? profitOf(cur) : { business: stats.monthly_business_profit ?? 0, daily: stats.monthly_daily_net ?? 0, total: stats.monthly_profit }
  const prevProfit = prev ? profitOf(prev) : null

  const short = (v: number) => (hidden ? '' : compactPhp(v))
  const full = (v: number) => (hidden ? '••••••' : fmtSigned(v).replace(/^\+/, ''))
  const sales = stats.sales_count ?? 0
  const monthSales = stats.monthly_sales_count ?? 0
  const monthIncome = stats.monthly_daily_income ?? 0
  const monthExpense = stats.monthly_daily_expense ?? 0

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Your overview</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500">What you earned and spent: your own expenses, and the sales you made</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={`Your profit, ${cur ? monthLabel(cur.month, true) : 'this month'}`} value={fmtSigned(curProfit.total)} valueClass={tone(curProfit.total)}>
          {prevProfit ? <Delta {...change(curProfit.total, prevProfit.total)} since={`vs ${monthLabel(prev!.month)}`} /> : null}
        </Stat>
        <Stat label="Your profit, all time" value={fmtSigned(stats.overall_profit)} valueClass={tone(stats.overall_profit)}>
          <span>Sales <Amt value={compactPhp(stats.business_profit ?? 0)} /> · Daily <Amt value={compactPhp(stats.daily_net ?? 0)} /></span>
        </Stat>
        <Stat label="Sales you made" value={String(sales)} valueClass="text-gray-900 dark:text-gray-50">
          <span>{monthSales} this month · <Amt value={compactPhp(stats.monthly_business_profit ?? 0)} /> profit</span>
        </Stat>
        <Stat label="Your daily net, this month" value={fmtSigned(stats.monthly_daily_net ?? 0)} valueClass={tone(stats.monthly_daily_net ?? 0)}>
          <span>In <Amt value={compactPhp(monthIncome)} /> · Out <Amt value={compactPhp(monthExpense)} /></span>
        </Stat>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Your profit by month"
          note="Sales: profit on what you sold that month. Daily net: your income minus your expenses."
          legend={<Legend items={[
            { label: 'Your sales', dot: PROFIT_SERIES.business.dot },
            { label: PROFIT_SERIES.daily.label, dot: PROFIT_SERIES.daily.dot },
            { label: 'Total', mark: <span className="h-0.5 w-3 rounded bg-gray-800 dark:bg-gray-100" /> },
          ]} />}
          loading={loading} error={error}>
          {trend.length > 0 ? (
            <ProfitBarChart labels={trend.map((m) => monthLabel(m.month))} titles={trend.map((m) => monthLabel(m.month, true))}
              formatShort={short} formatFull={full} highlight={trend.length - 1}
              series={[
                { key: 'business', ...PROFIT_SERIES.business, label: 'Your sales', values: trend.map((m) => profitOf(m).business) },
                { key: 'daily', ...PROFIT_SERIES.daily, values: trend.map((m) => profitOf(m).daily) },
              ]} />
          ) : (
            <p className="flex h-[220px] items-center justify-center text-sm text-gray-400">Nothing yet: your sales and expenses show here month by month.</p>
          )}
        </ChartCard>

        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">This month</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <Row label="Sales profit" value={curProfit.business} to="/business/transactions" />
            <Row label="Income" value={monthIncome} to="/transactions" />
            <Row label="Expenses" value={-monthExpense} to="/transactions" />
            <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
              <Row label="Total" value={curProfit.total} bold />
            </div>
          </dl>
          <p className="mt-auto flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" />
            The business&apos;s wallets, gold and net worth are only on an admin&apos;s overview.
          </p>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value, to, bold = false }: { label: string; value: number; to?: string; bold?: boolean }) {
  const text = <span className={bold ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}>{label}</span>
  return (
    <div className="flex items-center justify-between gap-3">
      {to ? <Link to={to} className="group inline-flex items-center gap-1 hover:underline">{text}<ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" /></Link> : text}
      <dd className={['tabular-nums', bold ? 'font-bold' : 'font-medium', tone(value)].join(' ')}><Amt value={value === 0 ? formatCurrency(0) : fmtSigned(value)} /></dd>
    </div>
  )
}
