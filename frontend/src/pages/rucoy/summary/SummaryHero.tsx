import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeftRight, ChevronDown, Coins, HandCoins, TrendingUp, Users } from 'lucide-react'
import { fmtG, MM_FEE_PERIOD_LABEL, MM_FEE_PERIODS, type MmFeePeriod } from './summaryUtils'

/** Total gold banner: stash + gold in KKS trades, with the middleman fee for a chosen period. */
export function SummaryHero({ totalGold, tradesGold, tradeCount, logCount, accountCost, accountsToPay, mmFeeTotal, mmFeePeriod, onMmFeePeriodChange }: {
  totalGold: number
  tradesGold: number
  tradeCount: number
  logCount: number
  accountCost: number
  accountsToPay: number
  mmFeeTotal: number
  mmFeePeriod: MmFeePeriod
  onMmFeePeriodChange: (period: MmFeePeriod) => void
}) {
  const overallGold = totalGold + tradesGold
  const negative    = overallGold < 0

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
      <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />
      <div className={['absolute -top-16 left-1/3 h-48 w-48 rounded-full blur-3xl', negative ? 'bg-red-500/10' : 'bg-amber-400/10'].join(' ')} />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={['flex h-6 w-6 items-center justify-center rounded-lg', negative ? 'bg-red-400/20' : 'bg-amber-400/20'].join(' ')}>
                <Coins className={['h-3.5 w-3.5', negative ? 'text-red-300' : 'text-amber-400'].join(' ')} />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Gold</span>
            </div>
            <p className={['text-4xl font-bold', negative ? 'text-red-300' : 'text-amber-300'].join(' ')}>
              {overallGold.toLocaleString()} <span className="text-xl font-semibold opacity-60">G</span>
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <ArrowLeftRight className="h-3 w-3" />
              Stash + gold in {tradeCount} active trade{tradeCount !== 1 ? 's' : ''} · {logCount} log{logCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {negative && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/15 px-3 py-1 text-[11px] font-semibold text-red-200"
                title="More gold has been sold or deducted than added. Add the gold you received, or cancel entries that shouldn't count.">
                <AlertCircle size={12} /> More sold than added
              </span>
            )}
            {accountsToPay > 0 && (
              <Link to="/business/transactions" className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/25 transition-colors">
                <Users size={12} /> {fmtG(accountsToPay)} to pay on unpaid accounts
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/5 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><Coins size={11} /> Gold stash</p>
            <p className={['text-base font-bold', totalGold < 0 ? 'text-red-300' : 'text-slate-100'].join(' ')}>{fmtG(totalGold)}</p>
            <p className="text-[10px] text-slate-500">In your inventory</p>
          </div>
          <div className="rounded-xl bg-white/5 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><TrendingUp size={11} /> Trades gold</p>
            <p className="text-base font-bold text-amber-200">{fmtG(tradesGold)}</p>
            <p className="text-[10px] text-slate-500">Held in KKS trades</p>
          </div>
          <div className="rounded-xl bg-white/5 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><Users size={11} /> Account cost</p>
            <p className="text-base font-bold text-slate-100">{fmtG(accountCost)}</p>
            <p className="text-[10px] text-slate-500">Listed accounts</p>
          </div>
          <MmFeeTile total={mmFeeTotal} period={mmFeePeriod} onPeriodChange={onMmFeePeriodChange} />
        </div>
      </div>
    </div>
  )
}

/** Middleman fee total with a period dropdown that closes on an outside click. */
function MmFeeTile({ total, period, onPeriodChange }: { total: number; period: MmFeePeriod; onPeriodChange: (p: MmFeePeriod) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative rounded-xl bg-violet-500/10 px-4 py-3" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full text-left">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300/80"><HandCoins size={11} /> Middleman fee</p>
        <p className="text-base font-bold text-violet-200">{fmtG(total)}</p>
        <p className="flex items-center gap-0.5 text-[10px] text-violet-300/70">{MM_FEE_PERIOD_LABEL[period]} <ChevronDown size={10} /></p>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 z-20 min-w-[150px] rounded-xl border border-white/10 bg-slate-800 shadow-xl shadow-black/40 overflow-hidden">
          {MM_FEE_PERIODS.map((p) => (
            <button key={p} type="button" onClick={() => { onPeriodChange(p); setOpen(false) }}
              className={['flex w-full items-center justify-between gap-4 px-3.5 py-2 text-xs transition-colors', p === period ? 'bg-violet-500/20 text-violet-300 font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'].join(' ')}>
              <span>{MM_FEE_PERIOD_LABEL[p]}</span>
              {p === period && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
