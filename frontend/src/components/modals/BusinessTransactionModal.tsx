import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { BusinessTransaction, BusinessTransactionAction, BusinessTransactionType, RucoyAccount } from '@/types'
import type { BusinessTransactionPayload } from '@/api/business'
import { rucoyAccountsApi } from '@/api/rucoy'
import { formatCurrency, formatWithCommas, handleAmountInput, todayISO } from '@/utils/format'
import { flattenApiErrors } from '@/utils/api'

interface BusinessTransactionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: BusinessTransactionPayload) => Promise<void>
  transaction?: BusinessTransaction | null
  defaultAction?: BusinessTransactionAction | null
}

const TYPE_BUTTONS: { value: BusinessTransactionType; label: string }[] = [
  { value: 'account', label: 'Account' },
  { value: 'gold',    label: 'Gold'    },
  { value: 'expense', label: 'Item'    },
]

const EMPTY = (): BusinessTransactionPayload => ({
  type:        'account',
  action:      null,
  amount:      0,
  description: '',
  date:        todayISO(),
  notes:       '',
})

export function BusinessTransactionModal({ open, onClose, onSubmit, transaction, defaultAction }: BusinessTransactionModalProps) {
  const [form, setForm]           = useState<BusinessTransactionPayload>(EMPTY())
  const [amountStr, setAmountStr] = useState('')
  const [errors, setErrors]       = useState<Partial<Record<string, string>>>({})
  const [loading, setLoading]     = useState(false)

  // Account-specific state
  const [accounts, setAccounts]                 = useState<RucoyAccount[]>([])
  const [accountSearch, setAccountSearch]       = useState('')
  const [selectedAccount, setSelectedAccount]   = useState<RucoyAccount | null>(null)
  const [dropdownOpen, setDropdownOpen]         = useState(false)
  const [priceRate, setPriceRate]               = useState('')
  const [costRate, setCostRate]                 = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch accounts when type = account
  useEffect(() => {
    if (open && form.type === 'account') {
      rucoyAccountsApi.getAll().then(setAccounts).catch(() => {})
    }
  }, [open, form.type])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Computed PHP values
  const priceRateNum = parseFloat(priceRate) || 0
  const costRateNum  = parseFloat(costRate)  || 0
  const pricePhp  = selectedAccount?.price != null && priceRateNum ? (selectedAccount.price / 1_000_000) * priceRateNum : null
  const costPhp   = selectedAccount?.cost  != null && costRateNum  ? (selectedAccount.cost  / 1_000_000) * costRateNum  : null
  const profitPhp = pricePhp != null && costPhp != null ? pricePhp - costPhp : null

  // Auto-set amount when account fields change
  useEffect(() => {
    if (form.type !== 'account') return
    const computed = form.action === 'sell' ? pricePhp : form.action === 'buy' ? costPhp : null
    if (computed != null) {
      const rounded = Math.round(computed * 100) / 100
      setAmountStr(String(rounded))
      setForm((p) => ({ ...p, amount: rounded }))
    }
  }, [form.type, form.action, pricePhp, costPhp])

  // Reset on open
  useEffect(() => {
    if (open) {
      setErrors({})
      setSelectedAccount(null)
      setAccountSearch('')
      setDropdownOpen(false)
      setPriceRate('')
      setCostRate('')
      if (transaction) {
        const amt = parseFloat(transaction.amount)
        setAmountStr(String(amt))
        setForm({ type: transaction.type, action: transaction.action, amount: amt, description: transaction.description ?? '', date: transaction.date, notes: '' })
      } else {
        setAmountStr('')
        setForm({ ...EMPTY(), action: defaultAction ?? null })
      }
    }
  }, [open, transaction])

  const set = <K extends keyof BusinessTransactionPayload>(key: K, value: BusinessTransactionPayload[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  const handleTypeChange = (type: BusinessTransactionType) => {
    setForm((p) => ({ ...p, type }))
    if (type !== 'account') {
      setSelectedAccount(null)
      setAccountSearch('')
      setPriceRate('')
      setCostRate('')
    }
  }

  const handleActionToggle = (action: BusinessTransactionAction) => {
    set('action', form.action === action ? null : action)
  }

  const selectAccount = (account: RucoyAccount) => {
    setSelectedAccount(account)
    setAccountSearch('')
    setDropdownOpen(false)
    set('description', account.description || account.email)
  }

  const filteredAccounts = accounts.filter((a) => {
    const q = accountSearch.toLowerCase()
    return (a.description ?? '').toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
  })

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

  const fmtPHP = (v: number | null) => v != null ? formatCurrency(v) : '—'

  return (
    <Modal open={open} onClose={onClose} title={transaction ? 'Edit Transaction' : 'Add Transaction'}>
      <div className="flex flex-col gap-4">

        {/* Action — Buy / Sell */}
        <div className="flex gap-2">
          {(defaultAction ? [defaultAction] : ['buy', 'sell'] as BusinessTransactionAction[]).map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => !defaultAction && handleActionToggle(action)}
              disabled={!!defaultAction}
              className={[
                'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                action === 'buy'
                  ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
                  : 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700',
                defaultAction ? 'cursor-default' : '',
              ].join(' ')}
            >
              {action === 'buy' ? '− Buy' : '+ Sell'}
            </button>
          ))}
        </div>

        {/* Type — Account / Gold / Item */}
        <div className="flex gap-2">
          {TYPE_BUTTONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeChange(value)}
              className={[
                'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                form.type === value
                  ? value === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
                    : 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Account-specific fields */}
        {form.type === 'account' && (
          <>
            {/* Account selector */}
            <div className="relative" ref={dropdownRef}>
              <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Account</p>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-300 hover:border-gray-400 bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500"
              >
                <span className={selectedAccount ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
                  {selectedAccount ? (selectedAccount.description || selectedAccount.email) : 'Select an account…'}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {selectedAccount && (
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedAccount(null); setAccountSearch('') }}
                      className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X size={13} />
                    </span>
                  )}
                  <ChevronDown size={15} className="text-gray-400" />
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                    <Search size={13} className="shrink-0 text-gray-400" />
                    <input
                      autoFocus
                      type="text"
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      placeholder="Search…"
                      className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none dark:text-gray-200 dark:placeholder:text-gray-500"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredAccounts.length === 0 ? (
                      <p className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-500">No accounts found.</p>
                    ) : filteredAccounts.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => selectAccount(a)}
                        className="flex w-full flex-col px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{a.description || a.email}</span>
                        {a.description && <span className="text-xs text-gray-400 dark:text-gray-500">{a.email}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Formula rows: Price (G) × Rate = Price (₱) */}
            {([
              {
                goldLabel: 'Price (G)',
                goldValue: selectedAccount?.price,
                rateLabel: 'Price Rate ($)',
                rateValue: priceRate,
                onRateChange: setPriceRate,
                resultLabel: 'Price ($)',
                resultValue: fmtPHP(pricePhp),
                resultColor: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                goldLabel: 'Cost (G)',
                goldValue: selectedAccount?.cost,
                rateLabel: 'Cost Rate ($)',
                rateValue: costRate,
                onRateChange: setCostRate,
                resultLabel: 'Cost ($)',
                resultValue: fmtPHP(costPhp),
                resultColor: 'text-red-600 dark:text-red-400',
              },
            ]).map((row) => (
              <div key={row.goldLabel} className="flex items-end gap-2">
                {/* Gold value */}
                <div className="flex-1">
                  <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{row.goldLabel}</p>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800/60 dark:border-gray-700 dark:text-gray-300">
                    {row.goldValue != null ? row.goldValue.toLocaleString() : '—'}
                  </div>
                </div>
                {/* × */}
                <span className="pb-2 text-gray-400 dark:text-gray-500 text-sm font-medium shrink-0">×</span>
                {/* Rate input */}
                <div className="flex-1">
                  <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{row.rateLabel}</p>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={row.rateValue}
                    onChange={(e) => handleAmountInput(e.target.value, row.onRateChange)}
                    placeholder="0.0025"
                    className="block w-full rounded-lg border border-gray-300 hover:border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-600 dark:hover:border-gray-500 transition-colors"
                  />
                </div>
                {/* = */}
                <span className="pb-2 text-gray-400 dark:text-gray-500 text-sm font-medium shrink-0">=</span>
                {/* Computed result */}
                <div className="flex-1">
                  <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{row.resultLabel}</p>
                  <div className={['rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold dark:border-gray-700 dark:bg-gray-800/60', row.resultColor].join(' ')}>
                    {row.resultValue}
                  </div>
                </div>
              </div>
            ))}

            {/* Profit */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
              <p className="text-xs text-gray-500 dark:text-gray-400">Profit ($)</p>
              <p className={['text-sm font-semibold mt-0.5', profitPhp == null || profitPhp >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                {fmtPHP(profitPhp)}
              </p>
            </div>
          </>
        )}

        {/* Amount + Date */}
        <div className="flex gap-3">
          {form.type !== 'account' && (
            <div className="flex-1">
              <Input
                label="Amount"
                type="text"
                inputMode="decimal"
                value={formatWithCommas(amountStr)}
                onChange={(e) => handleAmountInput(e.target.value, (s) => { setAmountStr(s); set('amount', parseFloat(s) || 0) })}
                error={errors.amount}
                placeholder="0.00"
              />
            </div>
          )}
          <div className="flex-1">
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              error={errors.date}
            />
          </div>
        </div>

        <Input
          label="Description"
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional short description"
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {transaction ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
