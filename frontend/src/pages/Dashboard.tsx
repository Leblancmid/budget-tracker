import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Briefcase, PiggyBank, Plus, Target, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'
import { useAuth } from '@/context/AuthContext'
import { budgetsApi } from '@/api/budgets'
import { Card } from '@/components/ui/Card'
import { MonthNav } from '@/components/ui/MonthNav'
import { formatCurrency, formatDate, MONTHS } from '@/utils/format'
import { CategoryIcon } from '@/utils/categoryIcons'
import { Amt } from '@/context/AmountVisibilityContext'
import type { Budget } from '@/types'

const OTHER_COLOR = '#94a3b8'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

/** % change vs previous value, or null when there's nothing to compare against. */
function change(curr: number, prev: number | null) {
  if (prev == null || prev === 0) return null
  return ((curr - prev) / prev) * 100
}

function ChangePill({ pct, goodWhenUp }: { pct: number | null; goodWhenUp: boolean }) {
  if (pct == null || !isFinite(pct)) return null
  const up = pct >= 0
  const good = up === goodWhenUp
  return (
    <span className={['inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', good ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'].join(' ')}
      title="vs previous month">
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(pct) < 1 ? '<1' : Math.round(Math.abs(pct))}%
    </span>
  )
}

/** Donut of spending by category (SVG, no chart library). */
function SpendingDonut({ slices, total }: { slices: { label: string; value: number; color: string }[]; total: number }) {
  const r = 42, c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg viewBox="0 0 100 100" className="h-40 w-40 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth="12" className="stroke-gray-100 dark:stroke-gray-800" />
      {total > 0 && slices.map((s) => {
        const len = (s.value / total) * c
        const el = (
          <circle key={s.label} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="12"
            strokeDasharray={`${Math.max(len - 0.6, 0)} ${c}`} strokeDashoffset={-offset}>
            <title>{s.label}: {Math.round((s.value / total) * 100)}%</title>
          </circle>
        )
        offset += len
        return el
      })}
    </svg>
  )
}

export function Dashboard() {
  const { stats, month, year, loading, setMonth, setYear } = useDashboard()
  const { user } = useAuth()

  const [budgets, setBudgets]               = useState<Budget[]>([])
  const [budgetsLoading, setBudgetsLoading] = useState(true)
  useEffect(() => {
    setBudgetsLoading(true)
    budgetsApi.getAll(month, year).then(setBudgets).catch(() => setBudgets([])).finally(() => setBudgetsLoading(false))
  }, [month, year])

  const changeMonth = (m: number, y: number) => { setMonth(m); setYear(y) }

  const income  = stats?.total_income ?? 0
  const expense = stats?.total_expense ?? 0
  const net     = income - expense
  const savingsRate = income > 0 ? (net / income) * 100 : null

  // Per-month totals for the year (monthly_trend is grouped by month + type)
  const trend = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const inc = Number(stats?.monthly_trend.find((t) => t.month === m && t.type === 'income')?.total ?? 0)
    const exp = Number(stats?.monthly_trend.find((t) => t.month === m && t.type === 'expense')?.total ?? 0)
    return { m, inc, exp }
  }), [stats])
  const trendMax = Math.max(1, ...trend.map((t) => Math.max(t.inc, t.exp)))
  const prevMonth = month > 1 ? trend[month - 2] : null // trend only covers the selected year

  // Donut: top categories + "Other" for the rest of the month's spending
  const slices = useMemo(() => {
    const top = (stats?.expense_by_category ?? []).map((e) => ({ label: e.category.name, value: Number(e.total), color: e.category.color, category: e.category }))
    const rest = expense - top.reduce((s, x) => s + x.value, 0)
    return rest > 0.005 ? [...top, { label: 'Other', value: rest, color: OTHER_COLOR, category: null }] : top
  }, [stats, expense])

  const budgetTotal = budgets.reduce((s, b) => s + parseFloat(b.amount), 0)
  const budgetSpent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0)
  const budgetPct   = budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0
  const watchList   = [...budgets].sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0)).slice(0, 4)

  const bizCount = stats?.business_count ?? 0

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">Here's your Daily Expenses for {MONTHS[month - 1]} {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthNav month={month} year={year} onChange={changeMonth} />
          <Link to="/transactions"
            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors">
            <Plus size={15} /> Transaction
          </Link>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="h-44 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={['flex h-6 w-6 items-center justify-center rounded-lg', net >= 0 ? 'bg-indigo-400/20' : 'bg-red-400/20'].join(' ')}>
                    <Wallet className={['h-3.5 w-3.5', net >= 0 ? 'text-indigo-300' : 'text-red-300'].join(' ')} />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Net this month</span>
                </div>
                <p className={['text-4xl font-bold', net >= 0 ? 'text-indigo-200' : 'text-red-300'].join(' ')}>
                  {net >= 0 ? '+' : '−'}<Amt value={formatCurrency(Math.abs(net))} />
                </p>
                {prevMonth && (prevMonth.inc > 0 || prevMonth.exp > 0) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {MONTHS[month - 2]}: {prevMonth.inc - prevMonth.exp >= 0 ? '+' : '−'}<Amt value={formatCurrency(Math.abs(prevMonth.inc - prevMonth.exp))} />
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {savingsRate != null && (
                  <div className="rounded-xl bg-white/5 px-3.5 py-2.5">
                    <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><PiggyBank size={11} /> Savings rate</p>
                    <p className={['text-lg font-bold', savingsRate >= 0 ? 'text-emerald-300' : 'text-red-300'].join(' ')}>{Math.round(savingsRate)}%</p>
                  </div>
                )}
                {bizCount > 0 && (
                  <Link to="/transactions" className="rounded-xl bg-teal-400/10 hover:bg-teal-400/20 px-3.5 py-2.5 transition-colors" title="Business transactions are tracked but not counted here">
                    <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-teal-300/80"><Briefcase size={11} /> Business</p>
                    <p className="text-sm font-bold text-teal-200">{bizCount} not counted</p>
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/15"><ArrowDownLeft className="h-4 w-4 text-emerald-300" /></div>
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Income <ChangePill pct={change(income, prevMonth?.inc ?? null)} goodWhenUp />
                  </p>
                  <p className="text-lg font-bold text-emerald-400"><Amt value={formatCurrency(income)} /></p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-400/15"><ArrowUpRight className="h-4 w-4 text-red-300" /></div>
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Expense <ChangePill pct={change(expense, prevMonth?.exp ?? null)} goodWhenUp={false} />
                  </p>
                  <p className="text-lg font-bold text-red-400"><Amt value={formatCurrency(expense)} /></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Spending + trend ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="flex flex-col">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Where it went</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Spending by category</p>
          </div>
          {loading ? (
            <div className="m-5 h-40 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />
          ) : slices.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-gray-400 dark:text-gray-500">No expenses this month.</p>
          ) : (
            <div className="flex flex-col items-center gap-4 p-5">
              <div className="relative">
                <SpendingDonut slices={slices} total={expense} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Spent</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100"><Amt value={formatCurrency(expense)} /></span>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2">
                {slices.map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-xs">
                    {s.category ? <CategoryIcon category={s.category} size="sm" className="!h-6 !w-6" /> : <span className="h-6 w-6 rounded-lg" style={{ backgroundColor: s.color }} />}
                    <span className="flex-1 truncate text-gray-600 dark:text-gray-300">{s.label}</span>
                    <span className="text-gray-400 dark:text-gray-500">{Math.round((s.value / (expense || 1)) * 100)}%</span>
                    <span className="w-24 text-right font-semibold text-gray-800 dark:text-gray-100"><Amt value={formatCurrency(s.value)} /></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{year} at a glance</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Click a month to open it</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Income</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" /> Expense</span>
            </div>
          </div>
          {loading ? (
            <div className="m-5 h-48 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />
          ) : (
            <div className="flex flex-1 flex-col justify-end gap-2 p-5">
              <div className="flex h-48 items-end gap-1 sm:gap-2">
                {trend.map((t) => {
                  const selected = t.m === month
                  const empty = t.inc === 0 && t.exp === 0
                  return (
                    <button
                      key={t.m}
                      onClick={() => changeMonth(t.m, year)}
                      title={`${MONTHS[t.m - 1]}: income ${formatCurrency(t.inc)}, expense ${formatCurrency(t.exp)}`}
                      className={['group flex h-full flex-1 items-end justify-center gap-0.5 rounded-lg px-0.5 pb-0.5 transition-colors', selected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'].join(' ')}
                    >
                      {empty ? (
                        <span className="mb-0.5 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
                      ) : (
                        <>
                          <span className="w-1/2 max-w-[14px] rounded-t-md bg-emerald-500/90 group-hover:bg-emerald-500 transition-all duration-700" style={{ height: `${(t.inc / trendMax) * 100}%` }} />
                          <span className="w-1/2 max-w-[14px] rounded-t-md bg-red-400/90 group-hover:bg-red-400 transition-all duration-700" style={{ height: `${(t.exp / trendMax) * 100}%` }} />
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-1 sm:gap-2">
                {trend.map((t) => (
                  <span key={t.m} className={['flex-1 text-center text-[10px] font-semibold', t.m === month ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'].join(' ')}>
                    {MONTHS[t.m - 1].slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Budgets + recent ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Budget health</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{budgets.length} budget{budgets.length !== 1 ? 's' : ''} this month</p>
            </div>
            <Link to="/budgets" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
              Budgets <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {budgetsLoading ? (
            <div className="m-5 h-32 rounded-xl animate-pulse bg-gray-100 dark:bg-gray-800" />
          ) : budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-10">
              <Target className="h-6 w-6 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No budgets set for this month.</p>
              <Link to="/budgets" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Set one →</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-5">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    <Amt value={formatCurrency(budgetSpent)} />
                    <span className="text-xs font-medium text-gray-400"> of <Amt value={formatCurrency(budgetTotal)} /></span>
                  </span>
                  <span className={['text-xs font-bold', budgetPct >= 100 ? 'text-red-500' : budgetPct >= 80 ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'].join(' ')}>{Math.round(budgetPct)}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className={['h-full rounded-full transition-all duration-700', budgetPct >= 100 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-indigo-500'].join(' ')} style={{ width: `${Math.min(100, budgetPct)}%` }} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {watchList.map((b) => {
                  const pct = b.percentage ?? 0
                  return (
                    <div key={b.id} className="flex items-center gap-3">
                      <CategoryIcon category={b.category} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 text-xs">
                          <span className="truncate font-medium text-gray-700 dark:text-gray-200">{b.category.name}</span>
                          <span className={['font-semibold', pct >= 100 ? 'text-red-500' : pct >= 80 ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'].join(' ')}>{Math.round(pct)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : b.category.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent transactions</h2>
            <Link to="/transactions" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
              View all <ArrowRight className="h-3.5 w-3.5" />
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
            ) : (stats?.recent_transactions?.length ?? 0) === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">No transactions yet.</p>
            ) : (
              stats!.recent_transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <CategoryIcon category={tx.category} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{tx.description || tx.category.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{tx.category.name} · {formatDate(tx.date)}</p>
                  </div>
                  <span className={['text-sm font-bold whitespace-nowrap', tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                    {tx.type === 'income' ? '+' : '−'}<Amt value={formatCurrency(tx.amount)} />
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
