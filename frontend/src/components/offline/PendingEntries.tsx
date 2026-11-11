import { useEffect, useState } from 'react'
import { AlertTriangle, CloudUpload, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Amt } from '@/components/ui/Amt'
import { openSyncReview } from '@/lib/offline/offlineEvents'
import { discardEntry, isDailyEntry, kindOf, refreshPending, usePendingEntries, type PendingEntry } from '@/lib/offline/outbox'
import { useOfflineStatus } from '@/lib/offline/offlineStatus'
import { toast } from '@/lib/toast'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Category } from '@/types'

const KIND: Record<'create' | 'update' | 'delete', { label: string; tone: string }> = {
  create: { label: 'New',    tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  update: { label: 'Edit',   tone: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  delete: { label: 'Delete', tone: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
}

/**
 * Daily entries added, edited or deleted offline that haven't been sent (Transactions page, above
 * the list). Nothing is sent until you approve it in the review window; a change the server refused
 * shows why.
 */
export function PendingEntries({ categories }: { categories: Category[] }) {
  const all = usePendingEntries()
  const { offline } = useOfflineStatus()
  const [discarding, setDiscarding] = useState<PendingEntry | null>(null)
  // Load this user's waiting entries from the device (e.g. after signing in)
  useEffect(() => { void refreshPending() }, [])
  const entries = all.filter(isDailyEntry)
  if (entries.length === 0) return null

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? 'Category'
  const kind = (e: PendingEntry) => kindOf(e) as 'create' | 'update' | 'delete'

  return (
    <Card className="overflow-hidden border-amber-200 dark:border-amber-900/50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 bg-amber-50/60 px-5 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex items-center gap-2">
          <CloudUpload size={16} className="text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Waiting for your approval</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Made offline on this device. Nothing is sent until you approve it{offline ? ' (once you\'re back online)' : ''}.
            </p>
          </div>
        </div>
        {!offline && (
          <button type="button" onClick={openSyncReview}
            className="flex items-center gap-1.5 rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/30">
            <CloudUpload size={13} /> Review &amp; send
          </button>
        )}
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {entries.map((e) => {
          const p = e.payload!
          return (
            <li key={e.client_id} className="flex items-start gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-gray-100">
                  <span className={['shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', KIND[kind(e)].tone].join(' ')}>{KIND[kind(e)].label}</span>
                  <span className={['truncate', kind(e) === 'delete' ? 'line-through opacity-70' : ''].join(' ')}>{p.description || categoryName(p.category_id)}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {categoryName(p.category_id)} · {formatDate(p.date)}{p.scope === 'business' ? ' · Business' : ''}
                </p>
                {e.error !== null && (
                  <p className="mt-1 flex items-start gap-1 text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" /> Refused: {e.error}
                  </p>
                )}
              </div>
              <span className={['shrink-0 text-sm font-semibold tabular-nums', p.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'].join(' ')}>
                <Amt value={`${p.type === 'income' ? '+' : '−'}${formatCurrency(p.amount)}`} />
              </span>
              <button type="button" onClick={() => setDiscarding(e)} title="Discard" aria-label="Discard"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={discarding !== null}
        onClose={() => setDiscarding(null)}
        onConfirm={async () => {
          if (discarding) await discardEntry(discarding)
          setDiscarding(null)
          toast.success('Discarded. The change was never made.')
        }}
        title="Discard this change?"
        confirmLabel="Discard"
        message={discarding?.payload ? `${discarding.payload.description || categoryName(discarding.payload.category_id)} (${formatCurrency(discarding.payload.amount)}) was only changed on this device. Discarding it means the change never happens.` : ''}
      />
    </Card>
  )
}
