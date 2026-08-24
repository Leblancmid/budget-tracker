import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatWithCommas, handleAmountInput, todayISO } from '@/utils/format'
import { flattenApiErrors } from '@/utils/api'
import type { BalanceAccount, BalanceEntry, BalanceEntryType } from '@/types'
import type { BalanceEntryPayload } from '@/api/master'

interface BalanceModalProps {
  open:            boolean
  onClose:         () => void
  onSubmit:        (data: BalanceEntryPayload) => Promise<void>
  entry?:          BalanceEntry | null
  defaultAccount?: BalanceAccount
  defaultType?:    BalanceEntryType
}

const EMPTY = (account: BalanceAccount, type: BalanceEntryType): BalanceEntryPayload => ({
  account,
  type,
  amount:      0,
  description: '',
  date:        todayISO(),
})

const PHP_ACCOUNTS: BalanceAccount[] = ['MARIBANK', 'MAYA', 'BANKO']

const ACCOUNT_STYLES: Record<BalanceAccount, string> = {
  PAYPAL:   'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700',
  BINANCE:  'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700',
  MEXC:     'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-700',
  MARIBANK: 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700',
  MAYA:     'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-700',
  BANKO:    'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700',
}

const ACCOUNT_LABELS: Record<BalanceAccount, string> = {
  PAYPAL: 'PayPal', BINANCE: 'Binance', MEXC: 'MEXC', MARIBANK: 'Maribank', MAYA: 'Maya', BANKO: 'BanKo',
}

export function BalanceModal({ open, onClose, onSubmit, entry, defaultAccount = 'PAYPAL', defaultType = 'add' }: BalanceModalProps) {
  const [form, setForm]           = useState<BalanceEntryPayload>(EMPTY(defaultAccount, defaultType))
  const [amountStr, setAmountStr] = useState('')
  const [errors, setErrors]       = useState<Partial<Record<string, string>>>({})
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      if (entry) {
        const amt = parseFloat(entry.amount)
        setAmountStr(String(amt))
        setForm({ account: entry.account, type: entry.type, amount: amt, description: entry.description ?? '', date: entry.date })
      } else {
        setAmountStr('')
        setForm(EMPTY(defaultAccount, defaultType))
      }
    }
  }, [open, entry, defaultAccount, defaultType])

  const set = <K extends keyof BalanceEntryPayload>(key: K, value: BalanceEntryPayload[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.amount || form.amount <= 0) errs.amount = 'Amount must be greater than 0.'
    if (!form.date) errs.date = 'Date is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit(form)
      onClose()
    } catch (err: unknown) {
      const flat = flattenApiErrors(err)
      if (flat) setErrors(flat)
    } finally {
      setLoading(false)
    }
  }

  const isPhp = PHP_ACCOUNTS.includes(form.account)

  const accountBtn = (acc: BalanceAccount) => (
    <button
      key={acc}
      type="button"
      onClick={() => set('account', acc)}
      className={[
        'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
        form.account === acc
          ? ACCOUNT_STYLES[acc]
          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
      ].join(' ')}
    >
      {ACCOUNT_LABELS[acc]}
    </button>
  )

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'Edit Entry' : 'Add / Sell Balance'}>
      <div className="flex flex-col gap-4">

        {/* Account toggle — USD row */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {accountBtn('PAYPAL')}
            {accountBtn('BINANCE')}
            {accountBtn('MEXC')}
          </div>
          <div className="flex gap-2">
            {accountBtn('MARIBANK')}
            {accountBtn('MAYA')}
            {accountBtn('BANKO')}
          </div>
        </div>

        <Input
          label={`Amount (${isPhp ? 'PHP' : 'USD'})`}
          type="text"
          inputMode="decimal"
          value={formatWithCommas(amountStr)}
          onChange={(e) => handleAmountInput(e.target.value, (s) => { setAmountStr(s); set('amount', parseFloat(s) || 0) })}
          error={errors.amount}
          placeholder="0.00"
        />

        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          error={errors.date}
        />

        <Input
          label="Description"
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional"
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {entry ? 'Save Changes' : form.type === 'add' ? 'Add' : 'Sell'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
