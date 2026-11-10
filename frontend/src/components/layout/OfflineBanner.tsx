import { WifiOff } from 'lucide-react'
import { useOfflineStatus } from '@/lib/offline/offlineStatus'

/** "Nov 10, 4:20 PM" in Manila time */
const when = (ms: number) =>
  new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

/** Shown under the tabs while the server can't be reached: what you see is a saved copy. */
export function OfflineBanner() {
  const { offline, showingSince } = useOfflineStatus()
  if (!offline) return null
  return (
    <div role="status" className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:px-6 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
      <WifiOff size={14} className="shrink-0" />
      <span>
        <b>You're offline.</b>{' '}
        {showingSince !== null ? `Showing what was saved on this device (as of ${when(showingSince)}). ` : ''}
        Changes need a connection.
      </span>
    </div>
  )
}
