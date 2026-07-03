import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Gold } from '@/types'
import { formatWithCommas, handleAmountInput } from '@/utils/format'

interface GoldModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { amount: number; description?: string }) => Promise<void>
  gold?: Gold | null
}

export function GoldModal({ open, onClose, onSubmit, gold }: GoldModalProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setError('')
      setAmount(gold ? parseFloat(gold.amount).toString() : '')
      setDescription(gold?.description ?? '')
    }
  }, [open, gold])

  const handleSubmit = async () => {
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed < 0) {
      setError('Enter a valid gold amount.')
      return
    }
    setLoading(true)
    try {
      await onSubmit({ amount: parsed, description: description || undefined })
      onClose()
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={gold ? 'Edit Gold' : 'Add Gold'} size="sm">
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Amount</p>
          <input
            type="text"
            inputMode="decimal"
            value={formatWithCommas(amount)}
            onChange={(e) => { handleAmountInput(e.target.value, setAmount); setError('') }}
            placeholder="e.g. 1,000,000"
            className={[
              'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
              'placeholder:text-gray-400 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
              error
                ? 'border-red-400 dark:border-red-500'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500',
            ].join(' ')}
          />
          {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Main stash"
        />

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{gold ? 'Save' : 'Add Gold'}</Button>
        </div>
      </div>
    </Modal>
  )
}
