import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { RucoyAccount } from '@/types'

interface AccountModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { description?: string; email: string; avatar?: string }) => Promise<void>
  account?: RucoyAccount | null
}

interface AccountForm {
  description: string
  email: string
  avatar: string
}

const EMPTY: AccountForm = { description: '', email: '', avatar: '' }

export function AccountModal({ open, onClose, onSubmit, account }: AccountModalProps) {
  const [form, setForm] = useState<AccountForm>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof AccountForm, string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      setForm(account
        ? { description: account.description ?? '', email: account.email, avatar: account.avatar ?? '' }
        : EMPTY
      )
    }
  }, [open, account])

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.email.trim()) errs.email = 'Email is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({
        email: form.email.trim(),
        description: form.description || undefined,
        avatar: form.avatar || undefined,
      })
      onClose()
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]> }
      if (e.errors) setErrors(Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])))
    } finally {
      setLoading(false)
    }
  }

  const set = <K extends keyof AccountForm>(k: K, v: AccountForm[K]) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <Modal open={open} onClose={onClose} title={account ? 'Edit Account' : 'Add Account'}>
      <div className="flex flex-col gap-4">
        <Input
          label="Email"
          type="text"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
          placeholder="account@example.com"
        />
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="e.g. Level 300 Archer"
        />
        <Input
          label="Avatar URL"
          value={form.avatar}
          onChange={(e) => set('avatar', e.target.value)}
          placeholder="https://..."
          hint="Optional link to the account avatar image"
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>{account ? 'Save Changes' : 'Add Account'}</Button>
        </div>
      </div>
    </Modal>
  )
}
