import type { ReactNode } from 'react'
import { BarChart3, DollarSign, TrendingDown, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import type { BusinessSummary } from '@/api/business'
import { formatCurrency } from '@/utils/format'
import { CUR_LABEL, fmtGold } from './salesUtils'

export interface ListedTotals {
  price: number
  cost: number
  profit: number
  pricePhp: number
  costPhp: number
  profitPhp: number
}

/** Hero banner — left: realized ₱ profit this month · right: listed accounts in G. */
export function SalesHero({ summary, totals, accountCount }: {
  summary: BusinessSummary | null
  totals: ListedTotals
  accountCount: number
}) {
  const monthPositive = (summary?.profit ?? 0) >= 0

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
      <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />
      <div className="absolute -bottom-16 left-1/2 h-40 w-40 rounded-full bg-indigo-400/[0.04]" />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 lg:divide-x divide-white/10">

        {/* Sold this month */}
        <section className="flex flex-col gap-4 lg:pr-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-400/20">
                <BarChart3 className="h-3.5 w-3.5 text-teal-400" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sold Profit</span>
              <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">{CUR_LABEL}</span>
            </div>
            <p className={['text-3xl font-bold', monthPositive ? 'text-teal-300' : 'text-red-400'].join(' ')}>
              <Amt value={formatCurrency(summary?.profit ?? 0)} />
            </p>
            <p className="mt-1 text-xs text-slate-500">Accounts &amp; golds marked as sold this month</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <HeroStat Icon={TrendingUp} label="Income" value={<Amt value={formatCurrency(summary?.income ?? 0)} />} valueCls="text-emerald-400" />
            <HeroStat Icon={TrendingDown} label="Cost" value={<Amt value={formatCurrency(summary?.expense ?? 0)} />} valueCls="text-red-400" />
          </div>
        </section>

        {/* Listed (unsold) accounts */}
        <section className="flex flex-col gap-4 pt-6 border-t border-white/10 lg:pt-0 lg:border-t-0 lg:pl-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-400/20">
                <Users className="h-3.5 w-3.5 text-indigo-300" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Listed Profit</span>
              <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">
                {accountCount} account{accountCount !== 1 ? 's' : ''}
              </span>
            </div>
            <p className={['text-3xl font-bold', totals.profit >= 0 ? 'text-emerald-300' : 'text-red-400'].join(' ')}>
              {fmtGold(totals.profit)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              ≈ <span className="font-semibold text-slate-300"><Amt value={formatCurrency(totals.profitPhp)} /></span> at the rates you've set
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <HeroStat Icon={DollarSign} label="Total Price" value={fmtGold(totals.price)} valueCls="text-indigo-300"
              sub={<Amt value={formatCurrency(totals.pricePhp)} />} />
            <HeroStat Icon={TrendingDown} label="Total Cost" value={fmtGold(totals.cost)} valueCls="text-slate-200"
              sub={<Amt value={formatCurrency(totals.costPhp)} />} />
          </div>
        </section>
      </div>
    </div>
  )
}

function HeroStat({ Icon, label, value, valueCls, sub }: {
  Icon: LucideIcon
  label: string
  value: ReactNode
  valueCls: string
  sub?: ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-3.5 w-3.5 text-slate-300" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className={['text-base font-bold truncate', valueCls].join(' ')}>{value}</p>
        {sub && <p className="text-[11px] font-medium text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  )
}
