import { useState } from 'react'
import { Coins, Plus } from 'lucide-react'
import { Amt } from '@/components/ui/Amt'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { businessTransactionsApi } from '@/api/business'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'
import { formatCurrency, formatWithCommas, handleAmountInput } from '@/utils/format'
import { costPaidInPhp, goldTopUp, goldWalletCost } from '@/utils/goldTrade'
import { WalletPicker } from '@/components/modals/WalletPicker'
import type { BalanceAccountConfig, BusinessTransaction } from '@/types'

/**
 * Top up a pending gold trade: added G goes onto its total price / cost, and the ₱ values
 * are recalculated from the trade's own rates. Mount it only while open so it starts empty.
 */
export function AddGoldModal({ target, wallets = [], onClose, onAdded }: {
  target: BusinessTransaction
  /** Balance wallets the added cost gold can be paid from */
  wallets?: BalanceAccountConfig[]
  onClose: () => void
  /** Called after the gold is added (paid = a wallet was charged), before the modal closes */
  onAdded: (tx: BusinessTransaction, paid: boolean) => void
}) {
  const [addPrice, setAddPrice] = useState('')
  const [addCost, setAddCost]   = useState('')
  const [addDesc, setAddDesc]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [adding, setAdding]     = useState(false)
  const [wallet, setWallet]     = useState<string | null>(null)

  // Cost paid in ₱: the cost grows by the extra ₱ paid, not by cost gold
  const phpCost    = costPaidInPhp(target.cost_gold, target.cost_php)
  const addPriceG  = parseFloat(addPrice) || 0
  const addCostNum = parseFloat(addCost) || 0
  const preview = goldTopUp(target, addPriceG, phpCost ? 0 : addCostNum, phpCost ? addCostNum : 0)
  const isMiddlemanFee = target.system_key === 'middleman_fee'
  // Bought more gold: pay the added cost from a wallet at the trade's own cost rates (or the ₱ paid)
  const payWallets = isMiddlemanFee ? [] : wallets.filter((w) => !w.hidden_at)
  const payWallet  = payWallets.find((w) => w.code === wallet) ?? null
  const walletCost = (w: BalanceAccountConfig) => phpCost
    ? (w.currency === 'PHP' ? (addCostNum > 0 ? addCostNum : null) : addCostNum > 0 ? goldWalletCost(addPriceG, target.cost_rate, null, 'USD') : null)
    : goldWalletCost(addCostNum, target.cost_rate, target.cost_php_rate ?? target.php_rate, w.currency)

  const handleAdd = async () => {
    const p = preview
    if (p.newPrice === p.oldPrice && p.newCost === p.oldCost && !(phpCost && addCostNum > 0)) { setError('Enter gold to add to the price or cost.'); return }
    if (payWallet && !(addCostNum > 0)) { setError(`Enter what you paid in Add to Cost ${phpCost ? '(₱)' : '(G)'} to pay for it from a wallet.`); return }
    if (payWallet && walletCost(payWallet) == null) { setError("Set this trade's cost rates in Edit before paying from a wallet."); return }
    setAdding(true)
    try {
      // The API adds the price gold to the Golds inventory (as a middleman fee on the Middleman Fee trade)
      await businessTransactionsApi.addGold(target.id, {
        price_gold:  p.newPrice - p.oldPrice,
        cost_gold:   p.newCost - p.oldCost,
        ...(phpCost ? { cost_php: addCostNum } : {}),
        description: addDesc.trim(),
        balance_account: payWallet?.code ?? null,
      })
      onAdded(target, !!payWallet)
      toast.success(`Gold added — now ${p.newPrice.toLocaleString()} G price · ${phpCost ? formatCurrency(p.costPhp ?? 0) : `${p.newCost.toLocaleString()} G`} cost.${payWallet ? ` Cost deducted from ${payWallet.name}.` : ''}`)
      onClose()
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to add gold.'))
    } finally {
      setAdding(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Add Gold" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <Coins size={15} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{target.description || 'Gold Trade'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Added gold goes onto the totals at this trade's rates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'price', label: 'Add to Price (G)', current: preview.oldPrice, next: preview.newPrice, value: addPrice, onChange: setAddPrice, textCls: 'text-emerald-600 dark:text-emerald-400' },
            phpCost
              ? { key: 'cost', label: 'Add to Cost (₱)', current: Number(target.cost_php ?? 0), next: preview.costPhp ?? 0, value: addCost, onChange: setAddCost, textCls: 'text-red-500 dark:text-red-400', unit: '₱' }
              : { key: 'cost', label: 'Add to Cost (G)', current: preview.oldCost, next: preview.newCost, value: addCost, onChange: setAddCost, textCls: 'text-red-500 dark:text-red-400' },
          ].map((f: { key: string; label: string; current: number; next: number; value: string; onChange: (v: string) => void; textCls: string; unit?: string }) => (
            <div key={f.key}>
              <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">+</span>
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus={f.key === 'price'}
                  value={formatWithCommas(f.value)}
                  onChange={(e) => { handleAmountInput(e.target.value, f.onChange); setError(null) }}
                  placeholder="0"
                  className="block w-full rounded-lg border border-gray-300 hover:border-gray-400 bg-white pl-7 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:border-gray-500 transition-colors"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                {f.unit ? <Amt value={formatCurrency(f.current)} /> : <>{f.current.toLocaleString()} G</>}
                {f.next !== f.current && <> → <span className={['font-semibold', f.textCls].join(' ')}>{f.unit ? <Amt value={formatCurrency(f.next)} /> : <>{f.next.toLocaleString()} G</>}</span></>}
              </p>
            </div>
          ))}
        </div>

        <Input
          label="Description"
          value={addDesc}
          onChange={(e) => setAddDesc(e.target.value)}
          placeholder={isMiddlemanFee ? 'e.g. Fee from trade with buyer' : 'e.g. Buyer paid the rest'}
        />
        {(parseFloat(addPrice) || 0) > 0 && (
          <p className="-mt-2 flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <Coins size={11} className="mt-px shrink-0 text-amber-500" />
            {isMiddlemanFee
              ? <>+{(parseFloat(addPrice) || 0).toLocaleString()} G is recorded as a middleman fee and added to your Golds inventory.</>
              : <>+{(parseFloat(addPrice) || 0).toLocaleString()} G is also added to your Golds inventory and history.</>}
          </p>
        )}

        {/* New totals preview */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 overflow-hidden">
          {[
            { label: 'Price (₱)',  value: preview.pricePhp,  cls: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Cost (₱)',   value: preview.costPhp,   cls: 'text-red-500 dark:text-red-400' },
            { label: 'Profit (₱)', value: preview.profitPhp, cls: (preview.profitPhp ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="flex flex-col items-center py-2.5 px-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</span>
              <span className={['text-sm font-bold mt-0.5', value != null ? cls : 'text-gray-300 dark:text-gray-600'].join(' ')}>
                {value != null ? <Amt value={formatCurrency(value)} /> : '—'}
              </span>
            </div>
          ))}
        </div>
        {preview.pricePhp == null && (
          <p className="-mt-2 text-xs text-amber-600 dark:text-amber-400">No rates set yet — only the G totals change until you set rates in Edit.</p>
        )}

        {payWallets.length > 0 && (
          <WalletPicker
            label="Pay for the added cost from"
            accounts={payWallets}
            value={wallet}
            onChange={(code) => { setWallet(code); setError(null) }}
            changeFor={(w) => { const c = walletCost(w); return c != null ? -c : null }}
          />
        )}

        {error && <p className="-mt-1 text-xs text-red-500">{error}</p>}

        <div className="modal-footer flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={adding}>Cancel</Button>
          <Button onClick={handleAdd} loading={adding} icon={<Plus className="h-4 w-4" />}>Add Gold</Button>
        </div>
      </div>
    </Modal>
  )
}
