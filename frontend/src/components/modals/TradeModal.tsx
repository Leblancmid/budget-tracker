import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Gold, Trade, TradeStatus } from '@/types'

interface TradeModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { gold_id: number; description?: string; status: TradeStatus; amount: number }) => Promise<void>
  golds: Gold[]
  trade?: Trade | null
}

interface TradeForm {
  gold_id: number
  description: string
  status: TradeStatus
  amount: string
}

const EMPTY: TradeForm = { gold_id: 0, description: '', status: 'cash', amount: '' }

export function TradeModal({ open, onClose, onSubmit, golds, trade }: TradeModalProps) {
  const [form, setForm] = useState<TradeForm>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof TradeForm, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      setForm(trade
        ? { gold_id: trade.gold_id, description: trade.description ?? '', status: trade.status, amount: parseFloat(trade.amount).toString() }
        : EMPTY
      )
    }
  }, [open, trade])

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.gold_id) errs.gold_id = 'Select a gold stash.'
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) errs.amount = 'Enter a valid amount.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({
        gold_id: form.gold_id,
        description: form.description || undefined,
        status: form.status,
        amount: parseFloat(form.amount),
      })
      onClose()
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]> }
      if (e.errors) setErrors(Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])))
    } finally {
      setLoading(false)
    }
  }

  const set = <K extends keyof TradeForm>(k: K, v: TradeForm[K]) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <Modal open={open} onClose={onClose} title={trade ? 'Edit Trade' : 'New Trade'}>
      <div className="flex flex-col gap-4">
        <Select
          label="Gold Stash"
          placeholder="Select gold stash"
          value={form.gold_id || ''}
          onChange={(e) => set('gold_id', Number(e.target.value))}
          options={golds.map((g) => ({ value: g.id, label: `#${g.id} — ${Number(g.amount).toLocaleString()} gold` }))}
          error={errors.gold_id}
        />

        <div className="flex gap-2">
          {(['cash', 'kks'] as TradeStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set('status', s)}
              className={[
                'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors uppercase',
                form.status === s
                  ? s === 'cash'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700'
                    : 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        <Input
          label="Amount (₱)"
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
          error={errors.amount}
          placeholder="0.00"
        />

        <Input
          label="Description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional trade notes"
        />

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{trade ? 'Save Changes' : 'Add Trade'}</Button>
        </div>
      </div>
    </Modal>
  )
}
