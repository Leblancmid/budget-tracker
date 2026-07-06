import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { BusinessTransaction, BusinessTransactionAction, BusinessTransactionType, RucoyAccount } from '@/types'
import type { BusinessTransactionPayload } from '@/api/business'
import { rucoyAccountsApi } from '@/api/rucoy'
import { handleAmountInput, todayISO } from '@/utils/format'
import { flattenApiErrors } from '@/utils/api'

type Category = 'account' | 'gold-item'

interface BusinessTransactionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: BusinessTransactionPayload) => Promise<void>
  transaction?: BusinessTransaction | null
  defaultAction?: BusinessTransactionAction | null
  defaultType?: BusinessTransactionType | null
  usedAccountIds?: number[]
}

const EMPTY = (type: BusinessTransactionType = 'gold'): BusinessTransactionPayload => ({
  type,
  action:      null,
  amount:      0,
  description: '',
  date:        todayISO(),
  notes:       '',
})

export function BusinessTransactionModal({ open, onClose, onSubmit, transaction, defaultAction, defaultType, usedAccountIds = [] }: BusinessTransactionModalProps) {
  const [form, setForm]   = useState<BusinessTransactionPayload>(EMPTY())
  const [errors, setErrors]       = useState<Partial<Record<string, string>>>({})
  const [loading, setLoading]     = useState(false)

  const [category, setCategory] = useState<Category>('account')

  // Account-specific state
  const [accounts, setAccounts]               = useState<RucoyAccount[]>([])
  const [accountSearch, setAccountSearch]     = useState('')
  const [selectedAccount, setSelectedAccount] = useState<RucoyAccount | null>(null)
  const [dropdownOpen, setDropdownOpen]       = useState(false)
  const [priceRate, setPriceRate]             = useState('')
  const [costRate, setCostRate]               = useState('')
  const [phpRate, setPhpRate]                 = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Gold & Item manual gold values
  const [priceGoldStr, setPriceGoldStr] = useState('')
  const [costGoldStr, setCostGoldStr]   = useState('')

  // Fetch accounts when category = account
  useEffect(() => {
    if (open && category === 'account') {
      rucoyAccountsApi.getAll().then((list) => {
        setAccounts(list)
        if (transaction?.account_id) {
          const match = list.find((a) => a.id === transaction.account_id)
          if (match) setSelectedAccount(match)
        }
      }).catch(() => {})
    }
  }, [open, category])

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

  // Computed values (source depends on category)
  const priceGoldValue = category === 'account' ? (selectedAccount?.price ?? null) : (parseFloat(priceGoldStr) || null)
  const costGoldValue  = category === 'account' ? (selectedAccount?.cost  ?? null) : (parseFloat(costGoldStr)  || null)
  const priceRateNum   = parseFloat(priceRate) || 0
  const costRateNum    = parseFloat(costRate)  || 0
  const pricePhp       = priceGoldValue != null && priceRateNum ? (priceGoldValue / 1_000_000) * priceRateNum : null
  const costPhp        = costGoldValue  != null && costRateNum  ? (costGoldValue  / 1_000_000) * costRateNum  : null
  const profitPhp      = pricePhp != null && costPhp != null ? pricePhp - costPhp : null
  const phpRateNum     = parseFloat(phpRate) || 0
  const profitInPhp    = profitPhp != null && phpRateNum ? profitPhp * phpRateNum : null

  // Auto-set amount from formula
  useEffect(() => {
    const computed = form.action === 'sell' ? pricePhp
      : form.action === 'buy'  ? costPhp
      : profitInPhp ?? profitPhp
    if (computed != null) {
      setForm((p) => ({ ...p, amount: Math.round(computed * 100) / 100 }))
    }
  }, [form.action, pricePhp, costPhp, profitPhp, profitInPhp])

  // Reset on open
  useEffect(() => {
    if (open) {
      setErrors({})
      setAccountSearch('')
      setDropdownOpen(false)
      setPriceGoldStr('')
      setCostGoldStr('')
      if (transaction) {
        const cat: Category = transaction.type === 'account' ? 'account' : 'gold-item'
        setCategory(cat)
        const amt = parseFloat(transaction.amount)
        setForm({
          type: transaction.type,
          action: transaction.action,
          account_id: transaction.account_id,
          price_rate: transaction.price_rate ? parseFloat(transaction.price_rate) : null,
          cost_rate: transaction.cost_rate ? parseFloat(transaction.cost_rate) : null,
          php_rate: transaction.php_rate ? parseFloat(transaction.php_rate) : null,
          amount: amt,
          description: transaction.description ?? '',
          date: transaction.date,
          notes: '',
        })
        setPriceRate(transaction.price_rate ? String(parseFloat(transaction.price_rate)) : '')
        setCostRate(transaction.cost_rate ? String(parseFloat(transaction.cost_rate)) : '')
        setPhpRate(transaction.php_rate ? String(parseFloat(transaction.php_rate)) : '')
        setSelectedAccount(null)
      } else {
        const cat: Category = defaultType === 'account' ? 'account' : 'gold-item'
        setCategory(cat)
        setSelectedAccount(null)
        setPriceRate('')
        setCostRate('')
        setPhpRate('')
        setForm({ ...EMPTY(cat === 'account' ? 'account' : 'gold'), action: defaultAction ?? null })
      }
    }
  }, [open, transaction, defaultType])

  const set = <K extends keyof BusinessTransactionPayload>(key: K, value: BusinessTransactionPayload[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat)
    if (cat === 'account') {
      setForm((p) => ({ ...p, type: 'account', action: null }))
      setPriceGoldStr('')
      setCostGoldStr('')
    } else {
      setSelectedAccount(null)
      setAccountSearch('')
      setForm((p) => ({ ...p, type: 'gold', action: null }))
    }
  }

  const selectAccount = (account: RucoyAccount) => {
    setSelectedAccount(account)
    setAccountSearch('')
    setDropdownOpen(false)
    set('description', account.description || account.email)
  }

  const filteredAccounts = accounts.filter((a) => {
    if (usedAccountIds.includes(a.id) && a.id !== transaction?.account_id) return false
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
    const payload = category === 'account'
      ? { ...form, account_id: selectedAccount?.id ?? null, price_rate: parseFloat(priceRate) || null, cost_rate: parseFloat(costRate) || null, php_rate: parseFloat(phpRate) || null }
      : form
    try {
      await onSubmit(payload)
      onClose()
    } catch (err: unknown) {
      const flat = flattenApiErrors(err)
      if (flat) setErrors(flat)
    } finally {
      setLoading(false)
    }
  }

  const fmtPHP = (v: number | null) =>
    v != null ? `$${v.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'

  const formulaRows = [
    {
      goldLabel: 'Price (G)',
      goldValue: priceGoldValue,
      goldStr: priceGoldStr,
      onGoldChange: setPriceGoldStr,
      rateLabel: 'Price Rate ($)',
      rateValue: priceRate,
      onRateChange: setPriceRate,
      resultLabel: 'Price ($)',
      resultValue: fmtPHP(pricePhp),
      resultColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      goldLabel: 'Cost (G)',
      goldValue: costGoldValue,
      goldStr: costGoldStr,
      onGoldChange: setCostGoldStr,
      rateLabel: 'Cost Rate ($)',
      rateValue: costRate,
      onRateChange: setCostRate,
      resultLabel: 'Cost ($)',
      resultValue: fmtPHP(costPhp),
      resultColor: 'text-red-600 dark:text-red-400',
    },
  ]

  return (
    <Modal open={open} onClose={onClose} title={transaction ? 'Edit Transaction' : 'Add Transaction'}>
      <div className="flex flex-col gap-4">

        {/* Category tabs */}
        <div className="flex gap-2">
          {(['account', 'gold-item'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={[
                'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                category === cat
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {cat === 'account' ? 'Account' : 'Gold & Item'}
            </button>
          ))}
        </div>

        {/* Selector: Account dropdown OR Gold & Item text input */}
        {category === 'account' ? (
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
        ) : (
          <Input
            label="Gold & Item"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Item name…"
          />
        )}

        {/* Formula rows */}
        {formulaRows.map((row) => (
          <div key={row.goldLabel} className="flex items-end gap-2">
            <div className="flex-1">
              <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{row.goldLabel}</p>
              {category === 'account' ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800/60 dark:border-gray-700 dark:text-gray-300">
                  {row.goldValue != null ? row.goldValue.toLocaleString() : '—'}
                </div>
              ) : (
                <input
                  type="text"
                  inputMode="decimal"
                  value={row.goldStr}
                  onChange={(e) => handleAmountInput(e.target.value, row.onGoldChange)}
                  placeholder="0"
                  className="block w-full rounded-lg border border-gray-300 hover:border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-600 dark:hover:border-gray-500 transition-colors"
                />
              )}
            </div>
            <span className="pb-2 text-gray-400 dark:text-gray-500 text-sm font-medium shrink-0">×</span>
            <div className="flex-1">
              <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{row.rateLabel}</p>
              <input
                type="text"
                inputMode="decimal"
                value={row.rateValue}
                onChange={(e) => handleAmountInput(e.target.value, row.onRateChange)}
                placeholder="0.25"
                className="block w-full rounded-lg border border-gray-300 hover:border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-600 dark:hover:border-gray-500 transition-colors"
              />
            </div>
            <span className="pb-2 text-gray-400 dark:text-gray-500 text-sm font-medium shrink-0">=</span>
            <div className="flex-1">
              <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{row.resultLabel}</p>
              <div className={['rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold dark:border-gray-700 dark:bg-gray-800/60', row.resultColor].join(' ')}>
                {row.resultValue}
              </div>
            </div>
          </div>
        ))}

        {/* Profit + PHP conversion */}
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-xs text-gray-500 dark:text-gray-400">Profit ($)</p>
            <p className={['text-sm font-semibold mt-0.5', profitPhp == null || profitPhp >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
              {fmtPHP(profitPhp)}
            </p>
          </div>
          <span className="pb-2 text-gray-400 dark:text-gray-500 text-sm font-medium shrink-0">×</span>
          <div className="flex-1">
            <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">PHP Rate</p>
            <input
              type="text"
              inputMode="decimal"
              value={phpRate}
              onChange={(e) => handleAmountInput(e.target.value, setPhpRate)}
              placeholder="58.5"
              className="block w-full rounded-lg border border-gray-300 hover:border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-600 dark:hover:border-gray-500 transition-colors"
            />
          </div>
          <span className="pb-2 text-gray-400 dark:text-gray-500 text-sm font-medium shrink-0">=</span>
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-xs text-gray-500 dark:text-gray-400">Profit (₱)</p>
            <p className={['text-sm font-semibold mt-0.5', profitInPhp == null || profitInPhp >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
              {profitInPhp != null ? `₱${profitInPhp.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
            </p>
          </div>
        </div>

        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          error={errors.date}
        />

        {/* Amount validation error (amount is auto-computed, no visible input) */}
        {errors.amount && (
          <p className="text-xs text-red-500 -mt-2">{errors.amount}</p>
        )}

        {/* Description (account only — gold-item uses the top input as description) */}
        {category === 'account' && (
          <Input
            label="Description"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional short description"
          />
        )}

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
