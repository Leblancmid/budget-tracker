import { loadSession } from '@/lib/authSession'
import { emitDataChanged } from '@/lib/dataEvents'
import { toast } from '@/lib/toast'
import { getOfflineStatus, markOffline, subscribeOfflineStatus } from './offlineStatus'
import { refreshPending, syncPending } from './outbox'
import { pruneResponses } from './responseCache'

/**
 * Offline support, started once from main.tsx:
 * - the service worker keeps the app itself on the device (production builds only; browsers allow
 *   it on https:// or localhost),
 * - old saved pages are dropped,
 * - the phone saying it lost / regained its connection updates the offline notice and refreshes the open page,
 * - daily entries added offline are sent whenever the server can be reached again.
 */
export function startOffline(): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => { /* the app still works online */ })
    })
  }

  void pruneResponses()

  window.addEventListener('offline', () => markOffline())
  // Back online: let the open page load fresh data (the next answer clears the offline notice)
  window.addEventListener('online', () => { emitDataChanged(); void sendWaiting() })

  // Entries added offline: try when the app starts, comes back to the front, or gets through again
  void sendWaiting()
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void sendWaiting() })
  let wasOffline = getOfflineStatus().offline
  subscribeOfflineStatus(() => {
    const { offline } = getOfflineStatus()
    if (wasOffline && !offline) void sendWaiting()
    wasOffline = offline
  })
}

let sending = false

/** Send daily entries added offline, and say what happened. */
async function sendWaiting(): Promise<void> {
  if (sending || !loadSession()) return
  sending = true
  try {
    if ((await refreshPending()).every((e) => e.error !== null)) return
    const { sent, refused } = await syncPending()
    if (sent > 0) toast.success(`Back online: ${sent} change${sent === 1 ? '' : 's'} made offline ${sent === 1 ? 'was' : 'were'} saved.`)
    if (refused > 0) toast.error(`${refused} change${refused === 1 ? '' : 's'} made offline couldn't be saved. See Transactions.`)
  } finally {
    sending = false
  }
}
