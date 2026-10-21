import { ArrowLeftRight, Wallet } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import { colorOf, fmtPhp, fmtUsd } from '@/utils/balanceAccounts'
import { formatShare, type Allocation, type BalanceTotals } from './balanceStats'

/** Net worth across all accounts, the USD / PHP split and how it's allocated. */
export function BalanceHero({ totals, allocation, accountCount, phpRate, phpInput, onPhpRateChange }: {
  totals: BalanceTotals
  allocation: Allocation
  accountCount: number
  phpRate: number
  phpInput: string
  onPhpRateChange: (value: string) => void
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
      <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400/20">
                <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Net Worth</span>
            </div>
            <p className={['text-3xl font-bold', totals.net >= 0 ? 'text-emerald-300' : 'text-red-300'].join(' ')}>
              <Amt value={fmtPhp(totals.net)} />
            </p>
            <p className="text-xs text-slate-500 mt-1">
              ≈ <Amt value={fmtUsd(totals.net / phpRate)} /> · across {accountCount} account{accountCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Exchange rate */}
          <label className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-slate-300">
            <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium">1 USD =</span>
            <span className="text-slate-400">₱</span>
            <input
              type="number" min="0.01" step="0.01" value={phpInput}
              onChange={(e) => onPhpRateChange(e.target.value)}
              className="w-16 rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </label>
        </div>

        {/* USD / PHP split */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">USD Balance</p>
            <p className="text-lg font-bold text-sky-300"><Amt value={fmtUsd(totals.usd)} /></p>
            <p className="text-[11px] text-slate-500">
              <Amt value={fmtPhp(totals.usd * phpRate)} /> · {totals.usdCount} account{totals.usdCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">PHP Balance</p>
            <p className="text-lg font-bold text-violet-300"><Amt value={fmtPhp(totals.php)} /></p>
            <p className="text-[11px] text-slate-500">{totals.phpCount} account{totals.phpCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Allocation */}
        {allocation.parts.length > 0 && (
          <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/10">
              {allocation.parts.map(({ a, share }) => (
                <div key={a.code} className={['h-full', colorOf(a.color).bar].join(' ')} style={{ width: `${share * 100}%` }} title={`${a.name} ${(share * 100).toFixed(1)}%`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {allocation.parts.map(({ a, share }) => (
                <span key={a.code} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className={['h-2 w-2 rounded-full', colorOf(a.color).bar].join(' ')} />
                  {a.name}
                  <span className="font-semibold text-slate-200">{formatShare(share)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
