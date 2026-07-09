import { useEffect, useRef, useState } from 'react'
import { User, X, CalendarClock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { AccountPayload } from '@/api/rucoy'
import type { AccountPaymentStatus, RucoyAccount } from '@/types'
import { formatWithCommas, handleAmountInput } from '@/utils/format'

interface AccountModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: AccountPayload) => Promise<void>
  account?: RucoyAccount | null
}

export function AccountModal({ open, onClose, onSubmit, account }: AccountModalProps) {
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<AccountPaymentStatus>('not_paid')
  const [paymentDate, setPaymentDate]     = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ email?: string; avatar?: string }>({})
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setErrors({})
      setAvatarFile(null)
      setEmail(account?.email ?? '')
      setDescription(account?.description ?? '')
      setPrice(account?.price != null ? String(account.price) : '')
      setCost(account?.cost != null ? String(account.cost) : '')
      setPaymentStatus(account?.payment_status ?? 'not_paid')
      setPaymentDate(account?.payment_date ?? '')
      setPreview(account?.avatar ?? null)
    }
  }, [open, account])

  useEffect(() => {
    if (!avatarFile) return
    const url = URL.createObjectURL(avatarFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setAvatarFile(file)
    setErrors((p) => ({ ...p, avatar: undefined }))
  }

  const clearAvatar = () => {
    setAvatarFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const validate = () => {
    const errs: typeof errors = {}
    if (!email.trim()) errs.email = 'Email is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({
        email: email.trim(),
        description: description || undefined,
        avatar: avatarFile,
        price: price !== '' ? parseFloat(price) : null,
        cost: cost !== '' ? parseFloat(cost) : null,
        payment_status: paymentStatus,
        payment_date: paymentDate || null,
      })
      onClose()
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]> }
      if (e.errors) {
        setErrors({
          email: e.errors.email?.[0],
          avatar: e.errors.avatar?.[0],
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={account ? 'Edit Account' : 'Add Account'}>
      <div className="flex flex-col gap-4">

        {/* Avatar picker */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {preview ? (
              <img
                src={preview}
                alt="Avatar preview"
                className="w-20 h-20 rounded-full object-cover border-2 border-emerald-400 dark:border-emerald-600"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                <User size={28} className="text-gray-400" />
              </div>
            )}
            {preview && (
              <button
                type="button"
                onClick={clearAvatar}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
            onChange={handleFile}
            className="hidden"
            id="avatar-upload"
          />
          <label
            htmlFor="avatar-upload"
            className="cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {preview ? 'Change photo' : 'Upload photo'}
          </label>
          {errors.avatar && <p className="text-xs text-red-500">{errors.avatar}</p>}
        </div>

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Level 300 Archer"
        />

        <Input
          label="Email / Username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="account@example.com"
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</p>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as AccountPaymentStatus)}
            className="block w-full rounded-lg border border-gray-300 hover:border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:border-gray-500 transition-colors"
          >
            <option value="not_paid">Not Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="fully_paid">Fully Paid</option>
          </select>
        </div>

        {/* Payment Date */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date</p>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 hover:border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:border-gray-500 transition-colors"
          />
          {paymentDate && (() => {
            const today = new Date(); today.setHours(0, 0, 0, 0)
            const due   = new Date(paymentDate + 'T00:00:00')
            const diff  = Math.round((due.getTime() - today.getTime()) / 86400000)
            const isToday = diff === 0
            const isPast  = diff < 0
            const isClose = diff > 0 && diff <= 7
            const color = isPast
              ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
              : isToday
              ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
              : isClose
              ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
            const label = isPast
              ? `Overdue by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''}`
              : isToday
              ? 'Due today'
              : `Due in ${diff} day${diff !== 1 ? 's' : ''}`
            return (
              <div className={['mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold', color].join(' ')}>
                <CalendarClock size={13} />
                {label}
              </div>
            )
          })()}
        </div>

        <div className="flex gap-3">
          {(['Price (G)', 'Cost (G)'] as const).map((label, idx) => {
            const raw = idx === 0 ? price : cost
            const setter = idx === 0 ? setPrice : setCost
            return (
              <div key={label} className="flex-1">
                <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatWithCommas(raw)}
                  onChange={(e) => handleAmountInput(e.target.value, setter)}
                  placeholder="e.g. 1,000,000"
                  className="block w-full rounded-lg border border-gray-300 hover:border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-600 dark:hover:border-gray-500 transition-colors"
                />
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {account ? 'Save Changes' : 'Add Account'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
