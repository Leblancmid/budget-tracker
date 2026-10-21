import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useAuth } from '@/context/auth'
import { useAmountVisibility } from '@/context/amountVisibility'
import { masterDashboardApi } from '@/api/master'
import { dashboardApi } from '@/api/dashboard'
import { goldToPhp, savedGoldRates } from '@/lib/goldRates'

/** Compact ₱ figure for a narrow sidebar: ₱444.9k, ₱1.2M. */
function compactPhp(n: number) {
  const a = Math.abs(n)
  const s = a >= 1e6 ? `${(a / 1e6).toFixed(2)}M` : a >= 1e3 ? `${(a / 1e3).toFixed(1)}k` : a.toFixed(0)
  return `${n < 0 ? '−' : ''}₱${s}`
}

interface Headline { label: string; value: number; delta: number | null; deltaLabel: string; to: string }

/**
 * Sidebar brand: the logo plus one live number — net worth for admins (same formula as
 * Master → Overview), or this month's Daily net for daily-only users.
 */
export function SidebarBrand({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { user } = useAuth()
  const { hidden } = useAmountVisibility()
  const visible = !hidden
  const dailyOnly = user?.role === 'daily_only'
  const [headline, setHeadline] = useState<Headline | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        if (dailyOnly) {
          const now = new Date()
          const d = await dashboardApi.getStats(now.getMonth() + 1, now.getFullYear())
          if (!cancelled) setHeadline({ label: 'Daily net this month', value: d.total_income - d.total_expense, delta: null, deltaLabel: '', to: '/' })
        } else {
          const s = await masterDashboardApi.getStats()
          // Same rates the Master → Overview page uses (and saves)
          const { usdRate, phpRate } = savedGoldRates()
          const toPhp = (g: number) => goldToPhp(g, usdRate, phpRate)
          const net = s.balance_php_total + s.balance_usd_total * phpRate + toPhp(s.gold_stash) + toPhp(s.total_price)
          if (!cancelled) setHeadline({ label: 'Net worth', value: net, delta: s.monthly_profit, deltaLabel: 'this month', to: '/master' })
        }
      } catch { /* the logo still shows */ }
    }
    load()
    // Refresh now and then so the number stays roughly current
    const t = window.setInterval(load, 5 * 60_000)
    return () => { cancelled = true; window.clearInterval(t) }
  }, [dailyOnly])

  const logo = (
    <span className="relative flex h-10 w-10 shrink-0">
      <span className="absolute inset-0 rounded-xl bg-violet-500/30 blur-md" />
      <img src="/logo.svg" alt="" className="relative h-10 w-10 rounded-xl" />
    </span>
  )

  if (collapsed) {
    return (
      <>
        <Link to={headline?.to ?? '/'} onClick={onNavigate} title={headline ? `${headline.label}: ${visible ? compactPhp(headline.value) : '••••'}` : undefined}
          className="hidden md:flex">{logo}</Link>
        {/* Mobile drawer is never collapsed */}
        <div className="md:hidden"><Expanded logo={logo} headline={headline} visible={visible} onNavigate={onNavigate} /></div>
      </>
    )
  }
  return <Expanded logo={logo} headline={headline} visible={visible} onNavigate={onNavigate} />
}

function Expanded({ logo, headline, visible, onNavigate }: { logo: React.ReactNode; headline: Headline | null; visible: boolean; onNavigate?: () => void }) {
  return (
    <Link to={headline?.to ?? '/'} onClick={onNavigate}
      className="group flex items-center gap-3 rounded-xl p-1.5 -m-1.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
      {logo}
      <div className="min-w-0 flex-1">
        {headline ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{headline.label}</p>
            <p className={['truncate text-base font-bold leading-tight tabular-nums', headline.value < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'].join(' ')}>
              {visible ? compactPhp(headline.value) : '₱ ••••'}
            </p>
            {headline.delta != null && (
              <p className={['flex items-center gap-0.5 text-[10px] font-semibold', headline.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                {headline.delta >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {visible ? compactPhp(headline.delta).replace('−', '') : '••••'} {headline.deltaLabel}
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="h-2 w-16 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <span className="h-3.5 w-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
        )}
      </div>
    </Link>
  )
}
