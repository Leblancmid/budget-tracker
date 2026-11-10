import { useEffect, useState } from 'react'
import { AlertTriangle, CloudUpload, RotateCw, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Amt } from '@/components/ui/Amt'
import { discardEntry, refreshPending, retryEntry, syncPending, usePendingEntries, type PendingEntry } from '@/lib/offline/outbox'
import { useOfflineStatus } from '@/lib/offline/offlineStatus'
import { toast } from '@/lib/toast'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Category } from '@/types'

/**
 * Daily entries added offline that haven't reached the server yet (Transactions page, above the
 * list). They're sent on their own when the connection is back; one the server refused shows why.
 */
export function PendingEntries({ categories }: { categories: Category[] }) {
  const entries = usePendingEntries()
  const { offline } = useOfflineStatus()
  const [discarding, setDiscarding] = useState<PendingEntry | null>(null)
  const [busy, setBusy] = useState(false)
  // Load this user's waiting entries from the device (e.g. after signing in)
  useEffect(() => { void refreshPending() }, [])
  if (entries.length === 0) return null

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? 'Category'
  const waiting = entries.filter((e) => e.error === null).length

  const sendNow = async (entry?: PendingEntry) => {
    setBusy(true)
    try {
      const { sent, refused } = entry ? await retryEntry(entry) : await syncPending()
      if (sent > 0) toast.success(`${sent} offline entr${sent === 1 ? 'y' : 'ies'} added.`)
      else if (refused > 0) toast.error('The server refused it. See the reason below.')
      else toast.error('Still can\'t reach the server. It\'ll try again when you\'re back online.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="overflow-hidden border-amber-200 dark:border-amber-900/50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 bg-amber-50/60 px-5 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex items-center gap-2">
          <CloudUpload size={16} className="text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Waiting to sync</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Added offline on this device. {waiting > 0 ? (offline ? 'They\'ll be added when you\'re back online.' : 'Sending…') : 'Fix or discard the ones below.'}
            </p>
          </div>
        </div>
        {waiting > 0 && (
          <button type="button" onClick={() => sendNow()} disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/30">
            <RotateCw size={13} className={busy ? 'animate-spin' : ''} /> Send now
          </button>
        )}
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {entries.map((e) => (
          <li key={e.client_id} className="flex items-start gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                {e.payload.description || categoryName(e.payload.category_id)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {categoryName(e.payload.category_id)} · {formatDate(e.payload.date)}{e.payload.scope === 'business' ? ' · Business' : ''}
              </p>
              {e.error !== null && (
                <p className="mt-1 flex items-start gap-1 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" /> Not added: {e.error}
                </p>
              )}
            </div>
            <span className={['shrink-0 text-sm font-semibold tabular-nums', e.payload.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
              <Amt value={`${e.payload.type === 'income' ? '+' : '−'}${formatCurrency(e.payload.amount)}`} />
            </span>
            <div className="flex shrink-0 items-center gap-1">
              {e.error !== null && (
                <button type="button" onClick={() => sendNow(e)} disabled={busy} title="Try again" aria-label="Try again"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                  <RotateCw size={14} />
                </button>
              )}
              <button type="button" onClick={() => setDiscarding(e)} title="Discard" aria-label="Discard"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={discarding !== null}
        onClose={() => setDiscarding(null)}
        onConfirm={async () => {
          if (discarding) await discardEntry(discarding)
          setDiscarding(null)
          toast.success('Discarded. It was never added.')
        }}
        title="Discard this entry?"
        confirmLabel="Discard"
        message={discarding ? `${discarding.payload.description || categoryName(discarding.payload.category_id)} (${formatCurrency(discarding.payload.amount)}) was only saved on this device. Discarding it means it's never added.` : ''}
      />
    </Card>
  )
}
