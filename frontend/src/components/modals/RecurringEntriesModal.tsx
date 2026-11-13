import { useState } from 'react'
import { ArrowLeft, Pause, Pencil, Play, Plus, Repeat, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Amt } from '@/components/ui/Amt'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { recurringEntriesApi, type RecurringEntryPayload } from '@/api/recurring'
import { useAsyncData } from '@/hooks/useAsyncData'
import { toast } from '@/lib/toast'
import { errorMessage, flattenApiErrors } from '@/utils/api'
import { formatCurrency, formatDate, formatWithCommas, handleAmountInput, todayManila } from '@/utils/format'
import { describeRepeat } from '@/utils/recurring'
import type { BalanceAccountConfig, Category, RecurringEntry, RecurringFrequency, TransactionType } from '@/types'

const NONE: RecurringEntry[] = []

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'daily',   label: 'Daily' },
]

interface Form {
  type: TransactionType
  amount: string
  description: string
  category_id: string
  frequency: RecurringFrequency
  next_date: string
  balance_account: string
  business: boolean
}

const blank = (): Form => ({
  type: 'expense', amount: '', description: '', category_id: '', frequency: 'monthly',
  next_date: todayManila(), balance_account: '', business: false,
})

const fromEntry = (e: RecurringEntry): Form => ({
  type: e.type, amount: String(parseFloat(e.amount)), description: e.description ?? '', category_id: String(e.category_id),
  frequency: e.frequency, next_date: e.next_date, balance_account: e.balance_account ?? '', business: e.scope === 'business',
})

/**
 * Bills, subscriptions and allowances that repeat: each is added to Transactions automatically
 * on its date (and taken from / added to its wallet). Mount it only while open.
 */
export function RecurringEntriesModal({ categories, wallets, canUseBusiness, onClose, onChanged }: {
  categories: Category[]
  /** PHP wallets it can be paid from / into (empty for daily-only users) */
  wallets: BalanceAccountConfig[]
  canUseBusiness: boolean
  onClose: () => void
  /** Something was posted or changed: refresh the transactions list */
  onChanged: () => void
}) {
  const { data: entries, loading, refetch } = useAsyncData(recurringEntriesApi.getAll, NONE)
  const [editing, setEditing]   = useState<RecurringEntry | 'new' | null>(null)
  const [form, setForm]         = useState<Form>(blank)
  const [errors, setErrors]     = useState<Record<string, string | undefined>>({})
  const [saving, setSaving]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RecurringEntry | null>(null)
  const [deleting, setDeleting] = useState(false)

  const walletByCode = new Map(wallets.map((w) => [w.code, w]))
  const typeCategories = categories.filter((c) => c.type === form.type)

  const open = (e: RecurringEntry | 'new') => {
    setEditing(e)
    setForm(e === 'new' ? blank() : fromEntry(e))
    setErrors({})
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((x) => ({ ...x, [key]: undefined }))
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!(Number(form.amount) > 0)) e.amount = 'Enter an amount.'
    if (!form.category_id) e.category_id = 'Pick a category.'
    if (!form.next_date) e.next_date = 'Pick the date.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    const payload: RecurringEntryPayload = {
      type: form.type,
      amount: Number(form.amount),
      description: form.description.trim() || null,
      category_id: Number(form.category_id),
      frequency: form.frequency,
      next_date: form.next_date,
      balance_account: form.balance_account || null,
      scope: canUseBusiness && form.business ? 'business' : 'personal',
    }
    try {
      const saved = editing === 'new' || editing == null
        ? await recurringEntriesApi.create(payload)
        : await recurringEntriesApi.update(editing.id, payload)
      const postedNow = form.next_date <= todayManila()
      toast.success(postedNow
        ? `Saved. Today's ${form.type} was added to Transactions; next on ${formatDate(saved.next_date)}.`
        : `Saved. It will be added on ${formatDate(saved.next_date)}.`)
      await refetch()
      if (postedNow) onChanged()
      setEditing(null)
    } catch (err) {
      const flat = flattenApiErrors(err)
      if (flat) setErrors(flat)
      else toast.error(errorMessage(err, 'Could not save.'))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (e: RecurringEntry) => {
    try {
      await recurringEntriesApi.update(e.id, { active: !e.active })
      toast.success(e.active ? 'Paused. Nothing will be added until you resume it.' : 'Resumed.')
      await refetch()
      if (!e.active && e.next_date <= todayManila()) onChanged()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update.'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await recurringEntriesApi.delete(deleteTarget.id)
      toast.success('Recurring entry deleted. Transactions it already added stay.')
      setDeleteTarget(null)
      await refetch()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete.'))
    } finally {
      setDeleting(false)
    }
  }

  const segBtn = (active: boolean, tone: 'red' | 'emerald') => [
    'flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
    active
      ? tone === 'red'
        ? 'bg-white text-red-600 shadow-sm ring-1 ring-inset ring-red-200 dark:bg-gray-950 dark:text-red-400 dark:ring-red-500/40'
        : 'bg-white text-emerald-600 shadow-sm ring-1 ring-inset ring-emerald-200 dark:bg-gray-950 dark:text-emerald-400 dark:ring-emerald-500/40'
      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
  ].join(' ')

  return (
    <Modal open onClose={onClose} title={editing ? (editing === 'new' ? 'New recurring entry' : 'Edit recurring entry') : 'Recurring'} size="2xl">
      {editing ? (
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save() }}>
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800" role="radiogroup" aria-label="Type">
            <button type="button" role="radio" aria-checked={form.type === 'expense'} className={segBtn(form.type === 'expense', 'red')}
              onClick={() => { set('type', 'expense'); set('category_id', '') }}>Expense</button>
            <button type="button" role="radio" aria-checked={form.type === 'income'} className={segBtn(form.type === 'income', 'emerald')}
              onClick={() => { set('type', 'income'); set('category_id', '') }}>Income</button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Amount (₱)" inputMode="decimal" value={formatWithCommas(form.amount)}
              onChange={(e) => handleAmountInput(e.target.value, (v) => set('amount', v))} placeholder="0.00" error={errors.amount} />
            <Input label="Description" value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder={form.type === 'expense' ? 'e.g. Internet, Netflix, Rent' : 'e.g. Salary, Allowance'} error={errors.description} />
            <Select label="Category" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}
              placeholder="Pick a category" options={typeCategories.map((c) => ({ value: c.id, label: c.name }))} error={errors.category_id} />
            <Select label="Repeats" value={form.frequency} onChange={(e) => set('frequency', e.target.value as RecurringFrequency)}
              options={FREQUENCIES} error={errors.frequency} />
            <Input label={editing === 'new' ? 'First date' : 'Next date'} type="date" value={form.next_date}
              onChange={(e) => set('next_date', e.target.value)} error={errors.next_date} />
            {wallets.length > 0 && (
              <Select label={form.type === 'expense' ? 'Paid from' : 'Goes into'} value={form.balance_account}
                onChange={(e) => set('balance_account', e.target.value)} placeholder="Not linked to Balance"
                options={wallets.map((w) => ({ value: w.code, label: w.name }))} error={errors.balance_account} />
            )}
          </div>

          {canUseBusiness && (
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.business} onChange={(e) => set('business', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              Business (not counted in Daily Expenses)
            </label>
          )}

          <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
            <Repeat size={12} className="mr-1 inline" />
            {describeRepeat(form.frequency, form.next_date)}
            {form.next_date && form.next_date <= todayManila() && ' Today\'s is added as soon as you save.'}
          </p>

          <div className="flex justify-between gap-3">
            <Button type="button" variant="secondary" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => setEditing(null)} disabled={saving}>Back</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bills, subscriptions and allowances that repeat. Each one is added to Transactions automatically on its date,
            and taken from (or added to) its wallet.
          </p>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-8 text-center dark:border-gray-700">
              <Repeat className="h-6 w-6 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No recurring entries yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Add your internet bill, rent or allowance once, and stop typing it every month.</p>
            </div>
          ) : (
            <div className="flex max-h-[55vh] flex-col divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100 scrollbar-thin dark:divide-gray-800 dark:border-gray-800">
              {entries.map((e) => {
                const w = e.balance_account ? walletByCode.get(e.balance_account) : undefined
                return (
                  <div key={e.id} role="button" tabIndex={0} onClick={() => open(e)} onKeyDown={(k) => { if (k.key === 'Enter') open(e) }}
                    className={['group flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40', e.active ? '' : 'opacity-60'].join(' ')}>
                    <CategoryIcon category={e.category} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{e.description || e.category.name}</p>
                      <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                        {e.active ? `Next on ${formatDate(e.next_date)}` : 'Paused'} · {FREQUENCIES.find((f) => f.value === e.frequency)?.label}
                        {w && ` · ${w.name}`}{e.scope === 'business' && ' · Business'}
                      </p>
                    </div>
                    <p className={['text-sm font-semibold', e.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                      {e.type === 'income' ? '+' : '−'}<Amt value={formatCurrency(e.amount)} />
                    </p>
                    <div className="flex items-center gap-0.5 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-within:opacity-100 md:group-focus-within:opacity-100">
                      <button onClick={(ev) => { ev.stopPropagation(); toggleActive(e) }} title={e.active ? 'Pause' : 'Resume'} aria-label={e.active ? 'Pause' : 'Resume'}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                        {e.active ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button onClick={(ev) => { ev.stopPropagation(); open(e) }} title="Edit" aria-label="Edit"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                        <Pencil size={14} />
                      </button>
                      <button onClick={(ev) => { ev.stopPropagation(); setDeleteTarget(e) }} title="Delete" aria-label="Delete"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-end">
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => open('new')}>New recurring entry</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete recurring entry"
        message={`Stop adding "${deleteTarget?.description || deleteTarget?.category.name}"? Transactions it already added stay.`}
      />
    </Modal>
  )
}
