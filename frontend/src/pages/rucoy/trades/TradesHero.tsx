import { ArrowLeftRight, Check, Coins } from 'lucide-react'

/** Gold held in KKS trades, trade counts and the KKS / cash split. */
export function TradesHero({ totalKksGold, tradeCount, kksCount, cashCount }: {
  totalKksGold: number
  tradeCount: number
  kksCount: number
  cashCount: number
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
      <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

      <div className="relative flex flex-col gap-4">
        {/* Primary: gold held in KKS trades */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400/20">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">KKS Gold</span>
          </div>
          <p className="text-3xl font-bold text-amber-400">
            {totalKksGold.toLocaleString()} <span className="text-xl font-semibold opacity-60">G</span>
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <ArrowLeftRight className="h-3 w-3" />
            Across {kksCount} active KKS trade{kksCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Sub-stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
              <ArrowLeftRight className="h-3.5 w-3.5 text-slate-300" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Trades</p>
              <p className="text-sm font-bold text-slate-200">{tradeCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20">
              <Coins className="h-3.5 w-3.5 text-amber-300" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">KKS</p>
              <p className="text-sm font-bold text-amber-300">{kksCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/20">
              <Check className="h-3.5 w-3.5 text-emerald-300" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cash</p>
              <p className="text-sm font-bold text-emerald-300">{cashCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
              <Coins className="h-3.5 w-3.5 text-slate-300" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Avg per KKS</p>
              <p className="text-sm font-bold text-slate-200">
                {kksCount > 0 ? `${Math.round(totalKksGold / kksCount).toLocaleString()} G` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* KKS vs Cash split */}
        {tradeCount > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-amber-400" style={{ width: `${(kksCount / tradeCount) * 100}%` }} />
              <div className="h-full bg-emerald-400" style={{ width: `${(cashCount / tradeCount) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-semibold">
              <span className="text-amber-300">KKS {Math.round((kksCount / tradeCount) * 100)}%</span>
              <span className="text-emerald-300">Cash {Math.round((cashCount / tradeCount) * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
