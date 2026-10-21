import { Coins, HandCoins, Pencil, Pin, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatCurrency, formatDate } from '@/utils/format'
import type { BusinessTransaction } from '@/types'
import { CUR_LABEL, txProfitPhp } from './salesUtils'

export function GoldTradeRow({ tx, archived = false, onEdit, onSell, onAddGold, onDelete, onUnarchive, totalReceived }: {
  tx: BusinessTransaction
  archived?: boolean
  onEdit?: () => void
  onSell?: () => void
  onAddGold?: () => void
  onDelete?: () => void
  onUnarchive?: () => void
  /** Middleman Fee trade: fees received this month (doesn't drop when gold is sold) */
  totalReceived?: number | null
}) {
  const isPending = tx.price_php == null
  const isSystem  = !!tx.system_key
  const profit    = txProfitPhp(tx)

  return (
    <div className={['flex items-center gap-3 px-5 py-3 group', archived ? 'opacity-75' : ''].join(' ')}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
        <Coins size={15} className="text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{tx.description || 'Gold Trade'}</p>
          {isSystem && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300" title="Permanent — fed by every middleman fee. Can be edited, topped up and sold, but not deleted.">
              <Pin size={9} /> Permanent
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(tx.date)}</p>
        {totalReceived != null && (
          <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 text-[11px] text-violet-700 dark:text-violet-300">
            <HandCoins size={11} />
            Total received ({CUR_LABEL}): <span className="font-semibold">{totalReceived.toLocaleString()} G</span>
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {/* Buttons — hover only */}
        <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
          {archived ? (
            <button onClick={onUnarchive} title="Restore"
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              <RotateCcw size={13} />
            </button>
          ) : (
            <>
              <button onClick={onEdit} title="Edit"
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                <Pencil size={13} />
              </button>
              {!isSystem && <button onClick={onDelete} title="Remove"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 size={13} />
              </button>}
            </>
          )}
        </div>

        {/* Gold price / cost, with received / paid progress */}
        <div className="hidden sm:flex flex-col items-end gap-1 text-right">
          <GoldAmountLine label="Price" total={tx.price_gold} done={tx.price_gold_received} doneLabel="Received" color="text-emerald-600 dark:text-emerald-400" />
          <GoldAmountLine label="Cost"  total={tx.cost_gold}  done={tx.cost_gold_paid}      doneLabel="Paid"     color="text-red-500 dark:text-red-400" />
          {tx.price_gold != null && tx.cost_gold != null && <GoldProfit price={tx.price_gold} cost={tx.cost_gold} />}
        </div>

        {/* PHP profit / status */}
        <div className="flex flex-col items-end text-right min-w-[96px]">
          {profit != null ? (
            <span className={['text-sm font-bold', profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
              <Amt value={formatCurrency(profit)} />
            </span>
          ) : (
            <span className="text-sm font-bold text-gray-300 dark:text-gray-600">—</span>
          )}
          {!archived && (
            <span className={['text-[10px] font-medium mt-0.5', isPending ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'].join(' ')}>
              {isPending ? 'Awaiting pricing' : 'Confirmed'}
            </span>
          )}
        </div>

        {/* Add gold to the totals */}
        {!archived && (
          <button
            onClick={onAddGold}
            title="Add gold to the price / cost"
            className="flex items-center gap-1 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
          >
            <Plus size={12} />
            Add
          </button>
        )}

        {/* Sell — confirmed trades only */}
        {!archived && (
          <button
            onClick={onSell}
            disabled={isPending || Number(tx.price_gold ?? 0) <= 0}
            title={isPending ? 'Set the rates before selling' : Number(tx.price_gold ?? 0) <= 0 ? 'No gold to sell yet' : 'Sell all or part of this gold'}
            className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <HandCoins size={12} />
            Sell
          </button>
        )}
      </div>
    </div>
  )
}

function GoldAmountLine({ label, total, done, doneLabel, color }: {
  label: string
  total: string | null
  done: string | null | undefined
  doneLabel: string
  color: string
}) {
  if (total == null) return null
  const totalNum = Number(total)
  const doneNum  = done != null ? Number(done) : null
  const pct      = doneNum != null && totalNum > 0 ? (doneNum / totalNum) * 100 : null
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={['text-xs font-semibold', color].join(' ')}>{label}: {totalNum.toLocaleString()} G</span>
      {pct != null && (
        <div className="flex items-center gap-1.5" title={`${doneLabel} ${doneNum!.toLocaleString()} of ${totalNum.toLocaleString()} G`}>
          <ProgressBar percent={pct} color="bg-amber-500" className="!w-20" />
          <span className={['text-[10px] font-semibold', pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'].join(' ')}>
            {pct >= 100 ? `${doneLabel} ✓` : `${Math.round(pct)}% ${doneLabel.toLowerCase()}`}
          </span>
        </div>
      )}
    </div>
  )
}

function GoldProfit({ price, cost }: { price: string; cost: string }) {
  const profitGold = Number(price) - Number(cost)
  return (
    <span className={['text-xs font-semibold', profitGold >= 0 ? 'text-indigo-500 dark:text-indigo-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
      Profit: {profitGold.toLocaleString()} G
    </span>
  )
}
