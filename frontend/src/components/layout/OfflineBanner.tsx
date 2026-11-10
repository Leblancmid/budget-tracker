import { Link } from 'react-router-dom'
import { CloudUpload, WifiOff } from 'lucide-react'
import { useOfflineStatus } from '@/lib/offline/offlineStatus'
import { usePendingEntries } from '@/lib/offline/outbox'

/** "Nov 10, 4:20 PM" in Manila time */
const when = (ms: number) =>
  new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

/**
 * Under the tabs: while the server can't be reached, that what's shown is a saved copy; and while
 * daily entries added offline are still waiting to be sent, how many (they're on Transactions).
 */
export function OfflineBanner() {
  const { offline, showingSince } = useOfflineStatus()
  const pending = usePendingEntries()
  const refused = pending.filter((e) => e.error !== null).length

  if (offline) {
    return (
      <div role="status" className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:px-6 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
        <WifiOff size={14} className="shrink-0" />
        <span>
          <b>You're offline.</b>{' '}
          {showingSince !== null ? `Showing what was saved on this device (as of ${when(showingSince)}). ` : ''}
          You can still add, edit and delete daily expenses and income; other changes need a connection.
          {pending.length > 0 && <> <Link to="/transactions" className="font-semibold underline">{pending.length} waiting to sync</Link>.</>}
        </span>
      </div>
    )
  }

  if (pending.length === 0) return null
  return (
    <div role="status" className={['flex shrink-0 items-center gap-2 border-b px-3 py-2 text-xs sm:px-6',
      refused > 0
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'
        : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'].join(' ')}>
      <CloudUpload size={14} className="shrink-0" />
      <span>
        {refused > 0
          ? <>{refused} change{refused === 1 ? '' : 's'} made offline couldn't be saved. </>
          : <>Sending {pending.length} change{pending.length === 1 ? '' : 's'} made offline… </>}
        <Link to="/transactions" className="font-semibold underline">See Transactions</Link>
      </span>
    </div>
  )
}
