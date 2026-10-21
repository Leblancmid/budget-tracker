import type { TradeStatus } from '@/types'

export function StatusPill({ status }: { status: TradeStatus }) {
  return status === 'cash' ? (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      CASH
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      KKS
    </span>
  )
}
