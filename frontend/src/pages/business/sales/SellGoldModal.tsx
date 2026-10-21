import { useState } from 'react'
import { Coins, HandCoins } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { businessTransactionsApi } from '@/api/business'
import { toast } from '@/lib/toast'
import { errorMessage, flattenApiErrors } from '@/utils/api'
import { formatCurrency, formatWithCommas, handleAmountInput } from '@/utils/format'
import type { BusinessTransaction } from '@/types'
import { sellPreview } from './salesUtils'

/** Sell all or part of a confirmed gold trade. Mount it only while open so it starts fresh. */
export function SellGoldModal({ target, onClose, onSold }: {
  target: BusinessTransaction
  onClose: () => void
  /** Called after the sale, before the modal closes */
  onSold: () => void
}) {
  const [sellAmount, setSellAmount] = useState(() => (target.price_gold != null ? String(Number(target.price_gold)) : ''))
  const [sellDeduct, setSellDeduct] = useState(true)
  const [sellDesc, setSellDesc]     = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [selling, setSelling]       = useState(false)

  const sellNum = parseFloat(sellAmount) || 0
  const preview = sellPreview(target, sellNum)
  const { sellTotal } = preview

  const handleSell = async () => {
    if (sellNum <= 0) { setError('Enter how much gold to sell.'); return }
    if (sellNum > sellTotal) { setError(`You can sell at most ${sellTotal.toLocaleString()} G.`); return }
    setSelling(true)
    try {
      const { remaining } = await businessTransactionsApi.sell(target.id, sellNum, sellDeduct, sellDesc.trim())
      onSold()
      toast.success(remaining
        ? `Sold ${sellNum.toLocaleString()} G — ${remaining.price_gold != null ? Number(remaining.price_gold).toLocaleString() : 0} G still pending.`
        : `Sold all ${sellNum.toLocaleString()} G.`)
      onClose()
    } catch (err: unknown) {
      setError(flattenApiErrors(err)?.amount ?? errorMessage(err, 'Failed to sell gold.'))
    } finally {
      setSelling(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Sell Gold" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <Coins size={15} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{target.description || 'Gold Trade'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Available: {sellTotal.toLocaleString()} G</p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount to sell (G)</p>
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">{Math.round(preview.fraction * 100)}% of trade</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={formatWithCommas(sellAmount)}
              onChange={(e) => { handleAmountInput(e.target.value, setSellAmount); setError(null) }}
              className={['block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 transition-colors', error ? 'border-red-400 dark:border-red-500' : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'].join(' ')}
            />
            {[50, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => { setSellAmount(String(Math.round(sellTotal * pct / 100))); setError(null) }}
                className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-600 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {pct === 100 ? 'All' : `${pct}%`}
              </button>
            ))}
          </div>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <Input
          label="Description"
          value={sellDesc}
          onChange={(e) => setSellDesc(e.target.value)}
          placeholder="e.g. Sold to buyer"
        />

        {/* Preview of the split */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Sold now</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Price <span className="font-semibold text-gray-700 dark:text-gray-200"><Amt value={formatCurrency(preview.pricePhp)} /></span></p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cost <span className="font-semibold text-gray-700 dark:text-gray-200"><Amt value={formatCurrency(preview.costPhp)} /></span> · {preview.costGold.toLocaleString()} G</p>
            <p className={['mt-1 text-sm font-bold', preview.pricePhp - preview.costPhp >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
              <Amt value={formatCurrency(preview.pricePhp - preview.costPhp)} /> profit
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Stays pending</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Price <span className="font-bold text-gray-700 dark:text-gray-200">{preview.remaining.toLocaleString()} G</span></p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cost <span className="font-bold text-gray-700 dark:text-gray-200">{preview.remainingCost.toLocaleString()} G</span></p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {preview.remaining > 0 ? 'Keeps the same rates' : 'Whole trade moves to Sold Golds'}
            </p>
          </div>
        </div>

        <label className="flex items-start gap-2.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
          <input
            type="checkbox"
            checked={sellDeduct}
            onChange={(e) => setSellDeduct(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">Deduct from Golds inventory</span>
            <span className="block text-xs text-gray-400 dark:text-gray-500">Removes {sellNum.toLocaleString()} G from Rucoy → Golds and logs the sale</span>
          </span>
        </label>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={selling}>Cancel</Button>
          <Button onClick={handleSell} loading={selling} icon={<HandCoins className="h-4 w-4" />}>
            {sellNum >= sellTotal ? 'Sell All' : `Sell ${sellNum.toLocaleString()} G`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
