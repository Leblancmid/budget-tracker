import { useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { balanceTransfersApi } from '@/api/master'
import { toast } from '@/lib/toast'
import { flattenApiErrors, errorMessage } from '@/utils/api'
import { fmtIn } from '@/utils/balanceAccounts'
import { formatWithCommas, handleAmountInput, todayManila } from '@/utils/format'
import type { BalanceAccountConfig } from '@/types'
import { WalletPicker } from './WalletPicker'

/**
 * Move money between two Balance accounts (e.g. Maribank → GCash), with an optional fee.
 * Across currencies (PayPal $ → GCash ₱) you enter what arrived. Mount it only while open.
 */
export function TransferModal({ accounts, balanceOf, defaultFrom, onClose, onDone }: {
  accounts: BalanceAccountConfig[]
  /** Current balance of an account (from the page's entries) */
  balanceOf: (a: BalanceAccountConfig) => number
  defaultFrom?: string
  onClose: () => void
  onDone: () => Promise<unknown> | void
}) {
  const [from, setFrom]         = useState<string | null | undefined>(defaultFrom)
  const [to, setTo]             = useState<string | null | undefined>(undefined)
  const [amount, setAmount]     = useState('')
  const [fee, setFee]           = useState('')
  const [received, setReceived] = useState('')
  const [date, setDate]         = useState(todayManila)
  const [note, setNote]         = useState('')
  const [errors, setErrors]     = useState<Record<string, string | undefined>>({})
  const [saving, setSaving]     = useState(false)

  const fromAcc = accounts.find((a) => a.code === from)
  const toAcc   = accounts.find((a) => a.code === to)
  const amountNum = Number(amount) || 0
  const feeNum    = Number(fee) || 0
  const crossCurrency = !!fromAcc && !!toAcc && fromAcc.currency !== toAcc.currency
  const arriving = crossCurrency ? Number(received) || 0 : amountNum
  const sym = (a?: BalanceAccountConfig) => (a?.currency === 'USD' ? '$' : '₱')

  const validate = () => {
    const e: typeof errors = {}
    if (!fromAcc) e.from_account = 'Pick where the money comes from.'
    if (!toAcc) e.to_account = 'Pick where it goes.'
    else if (to === from) e.to_account = 'Pick a different account to send to.'
    if (!(amountNum > 0)) e.amount = 'Enter the amount sent.'
    if (crossCurrency && !(Number(received) > 0)) e.received = `Enter how much arrived in ${toAcc!.currency}.`
    if (!date) e.date = 'Pick a date.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await balanceTransfersApi.create({
        from_account: fromAcc!.code,
        to_account:   toAcc!.code,
        amount:       amountNum,
        received:     crossCurrency ? Number(received) : null,
        fee:          feeNum > 0 ? feeNum : null,
        date,
        note:         note.trim() || null,
      })
      toast.success(`Moved ${fmtIn(fromAcc, amountNum)} from ${fromAcc!.name} to ${toAcc!.name}.`)
      await onDone()
      onClose()
    } catch (err) {
      const flat = flattenApiErrors(err)
      if (flat) setErrors(flat)
      else toast.error(errorMessage(err, 'Could not make the transfer.'))
    } finally {
      setSaving(false)
    }
  }

  const amountField = (id: string, label: string, value: string, onChange: (v: string) => void, symbol: string, error?: string, placeholder = '0.00') => (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className={['flex items-center gap-1.5 rounded-lg border bg-white px-3 dark:bg-gray-800', error ? 'border-red-400' : 'border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 dark:border-gray-600'].join(' ')}>
        <span className="font-bold text-gray-400">{symbol}</span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={formatWithCommas(value)}
          onChange={(e) => handleAmountInput(e.target.value, (v) => { onChange(v); setErrors((x) => ({ ...x, [id]: undefined })) })}
          placeholder={placeholder}
          className="w-full bg-transparent py-2 text-sm font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-600"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )

  return (
    <Modal open onClose={onClose} title="Transfer" size="2xl">
      <div className="flex flex-col gap-4">
        <WalletPicker
          label="From"
          accounts={accounts}
          value={from}
          onChange={(code) => { setFrom(code); setErrors((x) => ({ ...x, from_account: undefined })) }}
          balanceOf={balanceOf}
          changeFor={() => (amountNum > 0 ? -(amountNum + feeNum) : null)}
          allowNone={false}
          error={errors.from_account}
        />

        <div className="flex justify-center text-gray-300 dark:text-gray-600"><ArrowDown size={18} /></div>

        <WalletPicker
          label="To"
          accounts={accounts.filter((a) => a.code !== from)}
          value={to}
          onChange={(code) => { setTo(code); setErrors((x) => ({ ...x, to_account: undefined })) }}
          balanceOf={balanceOf}
          changeFor={() => (arriving > 0 ? arriving : null)}
          allowNone={false}
          error={errors.to_account}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {amountField('amount', `Amount sent${fromAcc ? ` (${fromAcc.currency})` : ''}`, amount, setAmount, sym(fromAcc), errors.amount)}
          {amountField('fee', 'Fee (optional)', fee, setFee, sym(fromAcc), errors.fee, 'e.g. 15 for InstaPay')}
          {crossCurrency && amountField('received', `Amount received (${toAcc!.currency})`, received, setReceived, sym(toAcc), errors.received)}
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} />
        </div>
        <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. load for gold payment" />

        {fromAcc && toAcc && amountNum > 0 && (
          <p className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
            <b>{fmtIn(fromAcc, amountNum + feeNum)}</b> leaves {fromAcc.name}{feeNum > 0 && <> ({fmtIn(fromAcc, feeNum)} fee)</>},{' '}
            <b>{fmtIn(toAcc, arriving)}</b> arrives in {toAcc.name}. Your net worth only changes by the fee{crossCurrency ? ' and the exchange rate' : ''}.
          </p>
        )}

        <div className="modal-footer flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Transfer</Button>
        </div>
      </div>
    </Modal>
  )
}
