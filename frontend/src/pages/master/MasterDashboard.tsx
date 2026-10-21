import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeftRight, Briefcase, Coins, DollarSign, Landmark, TrendingDown, TrendingUp, User, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MONTHS, formatCurrency } from '@/utils/format'
import { useMasterDashboard } from '@/hooks/useMasterDashboard'
import { Card } from '@/components/ui/Card'
import { Amt } from '@/components/ui/Amt'
import { goldToPhp as goldValueInPhp, savedGoldRates } from '@/lib/goldRates'
import { STORAGE_KEYS, writeString, type StorageKey } from '@/lib/storage'


const fmtUsd = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtSigned = (n: number) => `${n < 0 ? '−' : '+'}${formatCurrency(Math.abs(n))}`

/** One profit card: total with Business and Daily parts. */
function ProfitCard({ title, badge, total, business, daily }: { title: string; badge: string; total: number; business: number; daily: number }) {
  const parts = [
    { label: 'Business (sold)', value: business, Icon: Briefcase, color: 'bg-teal-500',   link: '/business' },
    { label: 'Daily net',       value: daily,    Icon: Wallet,    color: 'bg-indigo-500', link: '/' },
  ]
  const scale = Math.max(1, ...parts.map((p) => Math.abs(p.value)))
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400">{badge}</span>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <p className={['text-2xl font-bold', total >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
          <Amt value={fmtSigned(total)} />
        </p>
        {parts.map((p) => (
          <Link key={p.label} to={p.link} className="group flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                <p.Icon size={13} /> {p.label}
              </span>
              <span className={['font-semibold', p.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                <Amt value={fmtSigned(p.value)} />
              </span>
            </div>
            {/* Diverging bar: right = positive, left = negative */}
            <div className="relative h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="absolute inset-y-0 left-1/2 w-px bg-gray-300 dark:bg-gray-600" />
              <div className={['absolute inset-y-0 rounded-full', p.value >= 0 ? p.color : 'bg-red-400'].join(' ')}
                style={p.value >= 0
                  ? { left: '50%', width: `${(Math.abs(p.value) / scale) * 50}%` }
                  : { right: '50%', width: `${(Math.abs(p.value) / scale) * 50}%` }} />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}

export default function MasterDashboard() {
  const { stats, loading } = useMasterDashboard()

  const [usdRate, setUsdRate]   = useState(() => savedGoldRates().usdRate)
  const [phpRate, setPhpRate]   = useState(() => savedGoldRates().phpRate)
  const [usdInput, setUsdInput] = useState(() => String(savedGoldRates().usdRate))
  const [phpInput, setPhpInput] = useState(() => String(savedGoldRates().phpRate))

  const saveRate = (key: StorageKey, val: string, setVal: (s: string) => void, setNum: (n: number) => void) => {
    setVal(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0) {
      setNum(n)
      writeString(key, String(n))
    }
  }

  // Gold → ₱ via 1M G = $usdRate, 1 USD = ₱phpRate
  const goldToUsd = (g: number) => (g / 1_000_000) * usdRate
  const goldToPhp = (g: number) => goldValueInPhp(g, usdRate, phpRate)

  const goldStash    = stats?.gold_stash ?? 0
  const accountCostG = stats?.total_price ?? 0
  const kksGold      = stats?.kks_gold ?? 0
  const balPhp       = stats?.balance_php_total ?? 0
  const balUsd       = stats?.balance_usd_total ?? 0

  const parts: { key: string; label: string; php: number; color: string; Icon: LucideIcon }[] = [
    { key: 'php',     label: 'PHP balance',      php: balPhp,                  color: '#8b5cf6', Icon: Landmark },
    { key: 'usd',     label: 'USD balance',      php: balUsd * phpRate,        color: '#0ea5e9', Icon: DollarSign },
    { key: 'gold',    label: 'Gold stash',       php: goldToPhp(goldStash),    color: '#f59e0b', Icon: Coins },
    { key: 'account', label: 'Listed accounts',  php: goldToPhp(accountCostG), color: '#14b8a6', Icon: User },
  ]
  // Same formula as before: gold + account cost + USD accounts→PHP + PHP accounts
  const netWorth = parts.reduce((s, p) => s + p.php, 0)
  const positive = parts.filter((p) => p.php > 0)
  const posSum   = positive.reduce((s, p) => s + p.php, 0)
  const negative = parts.filter((p) => p.php < 0)

  const now      = new Date()
  const curLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  if (loading) return (
    <div className="flex flex-col gap-5">
      <div className="h-56 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-48 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
        <div className="h-48 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />)}
      </div>
    </div>
  )

  const assetCards = [
    {
      ...parts[0], to: '/master/balance', title: 'PHP balance', sub: `${stats?.balance_php_accounts ?? 0} PHP accounts`,
      main: formatCurrency(balPhp), secondary: `≈ ${fmtUsd(balPhp / phpRate)}`, tile: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
    },
    {
      ...parts[1], to: '/master/balance', title: 'USD balance', sub: `${stats?.balance_usd_accounts ?? 0} USD accounts`,
      main: fmtUsd(balUsd), secondary: `≈ ${formatCurrency(balUsd * phpRate)}`, tile: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
    },
    {
      ...parts[2], to: '/rucoy', title: 'Gold stash', sub: kksGold > 0 ? `+ ${kksGold.toLocaleString()} G in KKS trades (not counted)` : 'Rucoy inventory',
      main: `${goldStash.toLocaleString()} G`, secondary: `≈ ${formatCurrency(goldToPhp(goldStash))} · ${fmtUsd(goldToUsd(goldStash))}`, tile: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    },
    {
      ...parts[3], to: '/business/transactions', title: 'Listed accounts', sub: `${stats?.account_count ?? 0} accounts, at cost`,
      main: `${accountCostG.toLocaleString()} G`, secondary: `≈ ${formatCurrency(goldToPhp(accountCostG))} · ${fmtUsd(goldToUsd(accountCostG))}`, tile: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400',
    },
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Overview</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500">Everything you own and earn, in one place</p>
      </div>

      {/* ── Hero: net worth ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />
        <div className="absolute -top-16 left-1/3 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-400/20">
                  <Wallet className="h-3.5 w-3.5 text-violet-300" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Net worth</span>
              </div>
              <p className={['text-4xl font-bold', netWorth >= 0 ? 'text-violet-200' : 'text-red-300'].join(' ')}>
                {netWorth < 0 && '−'}<Amt value={formatCurrency(Math.abs(netWorth))} />
              </p>
              <p className="text-xs text-slate-500 mt-1">≈ <Amt value={fmtUsd(netWorth / phpRate)} /> · balances + gold + listed accounts</p>
            </div>

            {/* Exchange rates */}
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><ArrowLeftRight size={11} /> Rates</span>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-slate-300">
                  <span className="font-medium">1M G = $</span>
                  <input type="number" min="0.000001" step="0.01" value={usdInput}
                    onChange={(e) => saveRate(STORAGE_KEYS.masterUsdRate, e.target.value, setUsdInput, setUsdRate)}
                    className="w-14 rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-violet-400/40" />
                </label>
                <label className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-slate-300">
                  <span className="font-medium">1 USD = ₱</span>
                  <input type="number" min="0.01" step="0.01" value={phpInput}
                    onChange={(e) => saveRate(STORAGE_KEYS.masterPhpRate, e.target.value, setPhpInput, setPhpRate)}
                    className="w-14 rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-violet-400/40" />
                </label>
              </div>
            </div>
          </div>

          {/* Allocation: what makes up the positive side, and what pulls it down */}
          <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
            {posSum > 0 && (
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                {positive.map((p) => (
                  <div key={p.key} className="h-full" style={{ width: `${(p.php / posSum) * 100}%`, backgroundColor: p.color }} title={`${p.label}: ${formatCurrency(p.php)}`} />
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {parts.map((p) => (
                <span key={p.key} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.label}
                  <span className={['font-semibold', p.php < 0 ? 'text-red-300' : 'text-slate-200'].join(' ')}>
                    {p.php < 0 && '−'}<Amt value={formatCurrency(Math.abs(p.php))} />
                  </span>
                </span>
              ))}
            </div>
            {negative.length > 0 && (
              <p className="text-[11px] text-red-300/80">
                {negative.map((p) => p.label).join(' and ')} {negative.length === 1 ? 'is' : 'are'} negative and {negative.length === 1 ? 'pulls' : 'pull'} net worth down.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Profit ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ProfitCard title="This month's profit" badge={curLabel}
          total={stats?.monthly_profit ?? 0} business={stats?.monthly_business_profit ?? 0} daily={stats?.monthly_daily_net ?? 0} />
        <ProfitCard title="All-time profit" badge="Since you started"
          total={stats?.overall_profit ?? 0} business={stats?.business_profit ?? 0} daily={stats?.daily_net ?? 0} />
      </div>

      {/* ── Assets ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">What you hold</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {assetCards.map((a) => {
            const share = posSum > 0 && a.php > 0 ? a.php / posSum : 0
            return (
              <Link key={a.key} to={a.to}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all">
                <div className="h-1 w-full" style={{ backgroundColor: a.color }} />
                <div className="flex items-start gap-3 px-4 pt-3.5">
                  <span className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', a.tile].join(' ')}><a.Icon size={16} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{a.title}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate" title={a.sub}>{a.sub}</p>
                  </div>
                  <ArrowRight size={14} className="mt-1 text-gray-300 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </div>
                <div className="flex flex-1 flex-col gap-2 px-4 py-3.5">
                  <p className={['text-xl font-bold', a.php < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'].join(' ')}>
                    <Amt value={a.main} />
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500"><Amt value={a.secondary} /></p>
                  <div className="mt-auto flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full rounded-full" style={{ width: `${share * 100}%`, backgroundColor: a.color }} />
                    </div>
                    <span className={['text-[11px] font-semibold', a.php < 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'].join(' ')}>
                      {a.php < 0 ? <><TrendingDown size={11} className="inline -mt-0.5" /> negative</> : share > 0 ? <><TrendingUp size={11} className="inline -mt-0.5" /> {Math.round(share * 100)}%</> : '—'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
