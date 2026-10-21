import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Briefcase, Ban, StickyNote, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { BalanceAccountConfig, Category, Transaction, TransactionScope } from '@/types'
import { formatWithCommas, handleAmountInput, todayISO } from '@/utils/format'
import { colorOf, fmtPhp, iconOf } from '@/utils/balanceAccounts'
import { categoryIcon } from '@/utils/categoryIcons'
import { flattenApiErrors } from '@/utils/api'
import { Amt } from '@/components/ui/Amt'
import { readString, removeItem, STORAGE_KEYS, writeString } from '@/lib/storage'

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TransactionFormData) => Promise<void>
  categories: Category[]
  transaction?: Transaction | null
  /** PHP balance accounts that can be linked; empty/undefined hides the picker */
  balanceAccounts?: BalanceAccountConfig[]
}

export interface TransactionFormData {
  category_id: number
  type: 'income' | 'expense'
  scope: TransactionScope
  amount: number
  description: string
  date: string
  notes: string
  balance_account: string | null
}


const emptyForm = (): TransactionFormData => ({
  category_id: 0,
  type: 'expense',
  scope: 'personal',
  amount: 0,
  description: '',
  date: todayISO(),
  notes: '',
  balance_account: readString(STORAGE_KEYS.lastBalanceAccount) || null,
})

export function TransactionModal({ open, onClose, onSubmit, categories, transaction, balanceAccounts = [] }: TransactionModalProps) {
  const [form, setForm] = useState<TransactionFormData>(emptyForm)
  const [amountStr, setAmountStr] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    if (transaction) {
      const amt = parseFloat(transaction.amount)
      setAmountStr(String(amt))
      setForm({
        category_id: transaction.category_id,
        type: transaction.type,
        scope: transaction.scope ?? 'personal',
        amount: amt,
        description: transaction.description ?? '',
        date: transaction.date,
        notes: transaction.notes ?? '',
        balance_account: transaction.balance_entry?.account ?? null,
      })
      setShowNotes(!!transaction.notes)
    } else {
      setAmountStr('')
      const f = emptyForm()
      // Forget a remembered account that no longer exists
      if (f.balance_account && !balanceAccounts.some((a) => a.code === f.balance_account)) f.balance_account = null
      setForm(f)
      setShowNotes(false)
    }
  }, [open, transaction]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCategories = categories.filter((c) => c.type === form.type)
  const isIncome = form.type === 'income'
  const linked   = balanceAccounts.find((a) => a.code === form.balance_account)

  /**
   * An account's balance *without* this transaction. When editing, the saved
   * transaction is already included in its original account's balance.
   */
  const balanceWithout = (a: BalanceAccountConfig) => {
    const current = a.balance ?? 0
    if (!transaction?.balance_entry || transaction.balance_entry.account !== a.code) return current
    const saved = parseFloat(transaction.amount)
    return current - (transaction.type === 'income' ? saved : -saved)
  }
  const balanceBefore = linked ? balanceWithout(linked) : 0
  const balanceAfter  = balanceBefore + (isIncome ? form.amount : -form.amount)

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.category_id) errs.category_id = 'Pick a category.'
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
      if (!transaction) {
        if (form.balance_account) writeString(STORAGE_KEYS.lastBalanceAccount, form.balance_account)
        else removeItem(STORAGE_KEYS.lastBalanceAccount)
      }
      onClose()
    } catch (err: unknown) {
      const flat = flattenApiErrors(err)
      if (flat) setErrors(flat)
    } finally {
      setLoading(false)
    }
  }

  const set = <K extends keyof TransactionFormData>(key: K, value: TransactionFormData[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  return (
    <Modal open={open} onClose={onClose} title={transaction ? 'Edit Transaction' : 'New Transaction'} size="lg">
      <div className="flex flex-col gap-5">

        {/* Expense / Income */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { set('type', t); set('category_id', 0) }}
              className={[
                'flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all',
                form.type === t
                  ? t === 'income'
                    ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-900 dark:text-emerald-400'
                    : 'bg-white text-red-600 shadow-sm dark:bg-gray-900 dark:text-red-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              ].join(' ')}
            >
              {t === 'income' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
              {t === 'income' ? 'Income' : 'Expense'}
            </button>
          ))}
        </div>

        {/* Amount — the hero field */}
        <div>
          <div className={[
            'flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-colors',
            errors.amount ? 'border-red-400' : isIncome ? 'border-emerald-200 focus-within:border-emerald-400 dark:border-emerald-900/60' : 'border-red-200 focus-within:border-red-400 dark:border-red-900/60',
          ].join(' ')}>
            <span className={['text-2xl font-bold', isIncome ? 'text-emerald-500' : 'text-red-500'].join(' ')}>{isIncome ? '+' : '−'}₱</span>
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={formatWithCommas(amountStr)}
              onChange={(e) => handleAmountInput(e.target.value, (s) => { setAmountStr(s); set('amount', parseFloat(s) || 0); setErrors((x) => ({ ...x, amount: undefined })) })}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-600"
            />
          </div>
          {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
        </div>

        {/* Personal / Business */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Counts toward</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'personal', label: 'Personal', hint: 'Included in Daily Expenses', Icon: User,
                on: 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300' },
              { value: 'business', label: 'Business', hint: 'Not counted in Daily Expenses', Icon: Briefcase,
                on: 'border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-600 dark:bg-teal-900/20 dark:text-teal-300' },
            ] as const).map(({ value, label, hint, Icon, on }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('scope', value)}
                className={[
                  'flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors',
                  form.scope === value ? on : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                <Icon size={16} className="mt-0.5 shrink-0" />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-[11px] opacity-75">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Category chips */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Category</p>
          {filteredCategories.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">No {form.type} categories yet — add one in Categories.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {filteredCategories.map((c) => {
                const selected = form.category_id === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { set('category_id', c.id); setErrors((x) => ({ ...x, category_id: undefined })) }}
                    className={[
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                      selected ? 'border-transparent text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
                    ].join(' ')}
                    style={selected ? { backgroundColor: c.color } : undefined}
                  >
                    {(() => { const Icon = categoryIcon(c.icon); return <Icon size={12} style={selected ? undefined : { color: c.color }} /> })()}
                    {c.name}
                  </button>
                )
              })}
            </div>
          )}
          {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id}</p>}
        </div>

        {/* Balance account */}
        {balanceAccounts.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{isIncome ? 'Add to account' : 'Pay from account'}</p>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">Updates your Balance</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => set('balance_account', null)}
                className={[
                  'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  !form.balance_account
                    ? 'border-gray-400 bg-gray-100 text-gray-700 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-200'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                <Ban size={12} /> None
              </button>
              {balanceAccounts.map((a) => {
                const c = colorOf(a.color)
                const Icon = iconOf(a.icon)
                const selected = form.balance_account === a.code
                return (
                  <button
                    key={a.code}
                    type="button"
                    onClick={() => set('balance_account', a.code)}
                    className={[
                      'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                      selected ? ['border-transparent ring-2', c.ring, c.soft, c.text].join(' ') : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
                    ].join(' ')}
                  >
                    <span className={['flex h-5 w-5 items-center justify-center rounded-md', c.iconTile].join(' ')}><Icon size={11} /></span>
                    <span className="flex flex-col items-start leading-tight">
                      <span>{a.name}</span>
                      <span className={['text-[10px] font-medium', balanceWithout(a) < 0 ? 'text-red-500' : 'opacity-70'].join(' ')}>
                        <Amt value={fmtPhp(balanceWithout(a))} />
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Selected account: balance before → after */}
            {linked && (() => {
              const c = colorOf(linked.color)
              const short = !isIncome && balanceAfter < 0
              return (
                <div className={['mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-xs', c.soft].join(' ')}>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{linked.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    <Amt value={fmtPhp(balanceBefore)} />
                    {form.amount > 0 && (
                      <>
                        {' → '}
                        <b className={short ? 'text-red-600 dark:text-red-400' : isIncome ? 'text-emerald-600 dark:text-emerald-400' : c.text}>
                          <Amt value={fmtPhp(balanceAfter)} />
                        </b>
                      </>
                    )}
                  </span>
                  {short && (
                    <span className="ml-auto font-semibold text-red-600 dark:text-red-400">
                      Not enough — short by <Amt value={fmtPhp(-balanceAfter)} />
                    </span>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Date + description */}
        <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-3">
          <Input label="Date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} error={errors.date} />
          <Input label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="e.g. Lunch, GCash payment" />
        </div>

        {showNotes ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Additional notes"
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none scrollbar-thin dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:hover:border-gray-500"
            />
          </div>
        ) : (
          <button type="button" onClick={() => setShowNotes(true)}
            className="-mt-2 flex items-center gap-1.5 self-start text-xs font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
            <StickyNote size={13} /> Add a note
          </button>
        )}

        {/* What will happen */}
        {form.amount > 0 && (
          <div className="flex flex-col gap-1 rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
            <p>
              {form.scope === 'business'
                ? <><Briefcase size={12} className="inline -mt-0.5 mr-1 text-teal-500" /><b>Business</b> — tracked here, but not counted in your Daily Expenses dashboard, budgets or reports.</>
                : <><User size={12} className="inline -mt-0.5 mr-1 text-indigo-500" />Counted as {isIncome ? 'income' : 'an expense'} in your Daily Expenses.</>}
            </p>
            {linked && (
              <p>
                {isIncome ? 'Adds' : 'Deducts'} <b className={isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{fmtPhp(form.amount)}</b> {isIncome ? 'to' : 'from'} <b>{linked.name}</b> in Balance.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {transaction ? 'Save Changes' : isIncome ? 'Add Income' : 'Add Expense'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
