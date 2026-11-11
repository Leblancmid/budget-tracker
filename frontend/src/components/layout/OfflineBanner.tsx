import { CloudUpload, WifiOff } from 'lucide-react'
import { openSyncReview } from '@/lib/offline/offlineEvents'
import { useOfflineStatus } from '@/lib/offline/offlineStatus'
import { usePendingEntries } from '@/lib/offline/outbox'

/** "Nov 10, 4:20 PM" in Manila time */
const when = (ms: number) =>
  new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

const reviewButton = (text: string) => (
  <button type="button" onClick={openSyncReview} className="font-semibold underline">{text}</button>
)

/**
 * Under the tabs: while the server can't be reached, that what's shown is a saved copy and changes
 * are kept on the device; once it's back, how many changes are waiting for your approval.
 */
export function OfflineBanner() {
  const { offline, showingSince } = useOfflineStatus()
  const pending = usePendingEntries()
  const refused = pending.filter((e) => e.error !== null).length
  const n = pending.length

  if (offline) {
    return (
      <div role="status" className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:px-6 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
        <WifiOff size={14} className="shrink-0" />
        <span>
          <b>You're offline.</b>{' '}
          {showingSince !== null ? `Showing what was saved on this device (as of ${when(showingSince)}). ` : ''}
          Changes you make are kept on this device and sent only after you approve them.
          {n > 0 && <> {n} waiting.</>}
        </span>
      </div>
    )
  }

  if (n === 0) return null
  return (
    <div role="status" className={['flex shrink-0 items-center gap-2 border-b px-3 py-2 text-xs sm:px-6',
      refused > 0
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'
        : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'].join(' ')}>
      <CloudUpload size={14} className="shrink-0" />
      <span>
        {n} change{n === 1 ? '' : 's'} made offline {n === 1 ? 'is' : 'are'} waiting for your approval
        {refused > 0 ? ` (${refused} refused by the server)` : ''}. {reviewButton('Review')}
      </span>
    </div>
  )
}
