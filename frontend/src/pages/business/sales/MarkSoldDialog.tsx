import { useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { BuyerField } from './BuyerField'

/** "Mark as sold": confirms the sale, with an optional "Sold to". Mount only while open. */
export function MarkSoldDialog({ name, note, loading, onClose, onConfirm }: {
  /** What's being sold ("Lv 700 Dist") */
  name: string
  /** A line under it, e.g. that it can be restored */
  note?: string
  loading: boolean
  onClose: () => void
  onConfirm: (soldTo: string | null) => void
}) {
  const [buyer, setBuyer] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onConfirm(buyer.trim() || null)
  }

  return (
    <Modal open onClose={loading ? () => {} : onClose} title="Mark as sold" size="sm">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50/70 px-3 py-2.5 dark:bg-emerald-900/15">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{name}</p>
            {note && <p className="text-xs text-gray-500 dark:text-gray-400">{note}</p>}
          </div>
        </div>
        <BuyerField value={buyer} onChange={setBuyer} autoFocus />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>Mark as sold</Button>
        </div>
      </form>
    </Modal>
  )
}
