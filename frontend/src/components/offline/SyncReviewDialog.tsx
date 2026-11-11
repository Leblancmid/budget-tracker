import { useState } from 'react'
import { AlertTriangle, CloudUpload } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Amt } from '@/components/ui/Amt'
import { useOpenSyncReview } from '@/lib/offline/offlineEvents'
import { discardEntries, syncPending, usePendingEntries } from '@/lib/offline/outbox'
import { describeEntry } from '@/lib/offline/describeRequest'
import { toast } from '@/lib/toast'

/** "Nov 10, 4:20 PM" in Manila time */
const when = (ms: number) =>
  new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

/**
 * Changes made offline, waiting for your approval. Opens by itself when the server can be reached
 * again (and from the "Review" buttons). Nothing is sent until you choose what to send.
 */
export function SyncReviewDialog() {
  const pending = usePendingEntries()
  const [open, setOpen] = useState(false)
  /** Unticked changes (everything is ticked by default) */
  const [unticked, setUnticked] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  useOpenSyncReview(() => { setUnticked(new Set()); setOpen(true) })

  const chosen = pending.filter((e) => !unticked.has(e.client_id))
  const toggle = (id: string) => setUnticked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const allTicked = chosen.length === pending.length

  const send = async () => {
    setSending(true)
    try {
      const { sent, refused } = await syncPending(chosen.map((e) => e.client_id))
      if (sent > 0) toast.success(`${sent} change${sent === 1 ? '' : 's'} sent and saved.`)
      if (refused > 0) toast.error(`${refused} change${refused === 1 ? ' was' : 's were'} refused. See why below.`)
      if (sent === 0 && refused === 0) toast.error('Still can\'t reach the server. Nothing was sent; try again later.')
      if (refused === 0 && sent === chosen.length && sent === pending.length) setOpen(false)
    } finally {
      setSending(false)
    }
  }

  const discard = async () => {
    const n = chosen.length
    await discardEntries(chosen)
    setConfirmDiscard(false)
    toast.success(`${n} change${n === 1 ? '' : 's'} discarded. ${n === 1 ? 'It was' : 'They were'} never sent.`)
    if (n === pending.length) setOpen(false)
  }

  return (
    <>
      <Modal open={open && pending.length > 0} onClose={() => !sending && setOpen(false)} title="Changes made offline" size="lg" keepOpenWhenSavedOffline>
        <div className="flex flex-col gap-4">
          <p className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <CloudUpload size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <span>
              You made {pending.length === 1 ? 'this change' : `these ${pending.length} changes`} while offline. <b>Nothing has been sent yet.</b>{' '}
              Tick what should be saved to the server; the rest can wait or be discarded.
            </span>
          </p>

          <div className="flex items-center justify-between text-xs">
            <button type="button" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              onClick={() => setUnticked(allTicked ? new Set(pending.map((e) => e.client_id)) : new Set())}>
              {allTicked ? 'Untick all' : 'Tick all'}
            </button>
            <span className="text-gray-400">Sent in the order you made them</span>
          </div>

          <ul className="max-h-[50vh] divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
            {pending.map((e) => {
              const { label, amount } = describeEntry(e)
              const ticked = !unticked.has(e.client_id)
              return (
                <li key={e.client_id}>
                  <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <input type="checkbox" checked={ticked} onChange={() => toggle(e.client_id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
                      <span className="block text-[11px] text-gray-400 dark:text-gray-500">Made {when(e.created_at)}</span>
                      {e.error !== null && (
                        <span className="mt-1 flex items-start gap-1 text-xs text-red-600 dark:text-red-400">
                          <AlertTriangle size={12} className="mt-0.5 shrink-0" /> Refused: {e.error} Send it again or discard it.
                        </span>
                      )}
                    </span>
                    {amount && <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-200"><Amt value={amount} /></span>}
                  </label>
                </li>
              )
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="secondary" onClick={() => setConfirmDiscard(true)} disabled={sending || chosen.length === 0}>
              Discard {chosen.length === pending.length ? 'all' : `${chosen.length}`}
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={sending}>Not now</Button>
              <Button onClick={send} loading={sending} disabled={chosen.length === 0} icon={<CloudUpload className="h-4 w-4" />}>
                Send {chosen.length === pending.length ? 'all' : `${chosen.length}`}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={discard}
        title={`Discard ${chosen.length === 1 ? 'this change' : `${chosen.length} changes`}?`}
        confirmLabel="Discard"
        message={`${chosen.length === 1 ? 'It was' : 'They were'} only made on this device. Discarding means ${chosen.length === 1 ? 'it never happens' : 'they never happen'}.`}
      />
    </>
  )
}
