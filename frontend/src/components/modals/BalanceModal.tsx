import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatWithCommas, handleAmountInput, todayISO } from '@/utils/format'
import { flattenApiErrors } from '@/utils/api'
import { colorOf, iconOf } from '@/utils/balanceAccounts'
import { toast } from '@/lib/toast'
import type { BalanceAccount, BalanceAccountConfig, BalanceEntry, BalanceEntryType } from '@/types'
import type { BalanceEntryPayload } from '@/api/master'

interface BalanceModalProps {
  open:            boolean
  onClose:         () => void
  onSubmit:        (data: BalanceEntryPayload) => Promise<void>
  /** Accounts the entry can belong to (visible ones, plus the entry's own if hidden) */
  accounts:        BalanceAccountConfig[]
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

export function BalanceModal({ open, onClose, onSubmit, accounts, entry, defaultAccount, defaultType = 'add' }: BalanceModalProps) {
  const fallbackAccount = defaultAccount ?? accounts[0]?.code ?? ''
  const [form, setForm]           = useState<BalanceEntryPayload>(EMPTY(fallbackAccount, defaultType))
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
        setForm(EMPTY(fallbackAccount, defaultType))
      }
    }
  }, [open, entry, fallbackAccount, defaultType])

  const set = <K extends keyof BalanceEntryPayload>(key: K, value: BalanceEntryPayload[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.account) errs.account = 'Choose an account.'
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
      else toast.error('Failed to save entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const account = accounts.find((a) => a.code === form.account)
  const isPhp   = account?.currency === 'PHP'
  const name    = account?.name ?? form.account

  const title = entry
    ? 'Edit Entry'
    : form.type === 'add' ? `Add to ${name}` : `Sell from ${name}`

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">

        {/* Account + type pickers — only when editing (new entries are locked to the clicked card) */}
        {entry && (
          <>
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Account</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {accounts.map((a) => {
                  const c = colorOf(a.color)
                  const Icon = iconOf(a.icon)
                  const selected = form.account === a.code
                  return (
                    <button key={a.code} type="button" onClick={() => set('account', a.code)}
                      className={[
                        'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm font-medium transition-colors',
                        selected
                          ? ['border-transparent ring-2', c.ring, c.soft, c.text].join(' ')
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                      ].join(' ')}>
                      <span className={['flex h-6 w-6 shrink-0 items-center justify-center rounded-md', c.iconTile].join(' ')}><Icon size={12} /></span>
                      <span className="truncate">{a.name}</span>
                      <span className="ml-auto text-[10px] font-semibold text-gray-400">{a.currency}</span>
                    </button>
                  )
                })}
              </div>
              {errors.account && <p className="mt-1 text-xs text-red-500">{errors.account}</p>}
            </div>

            <div className="flex gap-2">
              {(['add', 'sell'] as BalanceEntryType[]).map((t) => (
                <button key={t} type="button" onClick={() => set('type', t)}
                  className={[
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition-colors',
                    form.type === t
                      ? t === 'add'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'border-red-400 bg-red-50 text-red-600 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                  ].join(' ')}>
                  {t === 'add' ? <Plus size={14} /> : <Minus size={14} />}
                  {t === 'add' ? 'Add' : 'Sell'}
                </button>
              ))}
            </div>
          </>
        )}

        <Input
          label={`Amount (${isPhp ? 'PHP' : 'USD'})`}
          type="text"
          inputMode="decimal"
          value={formatWithCommas(amountStr)}
          onChange={(e) => handleAmountInput(e.target.value, (s) => { setAmountStr(s); set('amount', parseFloat(s) || 0) })}
          error={errors.amount}
          placeholder="0.00"
          autoFocus={!entry}
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
          <Button onClick={handleSubmit} loading={loading} variant={!entry && form.type === 'sell' ? 'danger' : 'primary'}>
            {entry ? 'Save Changes' : form.type === 'add' ? 'Add' : 'Sell'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
