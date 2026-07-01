import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Gold } from '@/types'

interface GoldModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { amount: number }) => Promise<void>
  gold?: Gold | null
}

export function GoldModal({ open, onClose, onSubmit, gold }: GoldModalProps) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setError('')
      setAmount(gold ? parseFloat(gold.amount).toString() : '')
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
      await onSubmit({ amount: parsed })
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
        <Input
          label="Amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={error}
          placeholder="e.g. 1000000"
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{gold ? 'Save' : 'Add Gold'}</Button>
        </div>
      </div>
    </Modal>
  )
}
