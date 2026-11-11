import { emitDataChanged } from '@/lib/dataEvents'
import { loadSession } from '@/lib/authSession'
import { openSyncReview } from './offlineEvents'
import { markOffline, onServerReached } from './offlineStatus'
import { refreshPending } from './outbox'
import { pruneResponses } from './responseCache'

/**
 * Offline support, started once from main.tsx:
 * - the service worker keeps the app itself on the device (production builds only; browsers allow
 *   it on https:// or localhost),
 * - old saved pages are dropped,
 * - the phone saying it lost / regained its connection updates the offline notice and refreshes the open page,
 * - changes made offline are never sent on their own: when the server can be reached again the
 *   app asks you to review and approve them first (SyncReviewDialog).
 */
export function startOffline(): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => { /* the app still works online */ })
    })
  }

  void pruneResponses()
  void refreshPending()

  window.addEventListener('offline', () => markOffline())
  // Back online: let the open page load fresh data (the answer clears the offline notice and asks about waiting changes)
  window.addEventListener('online', () => emitDataChanged())

  // Server reached (when the app opens, or again after being offline): ask about waiting changes
  onServerReached(() => { void askAboutWaiting() })
}

/** Open the review window if changes made offline are waiting. */
async function askAboutWaiting(): Promise<void> {
  if (!loadSession()) return
  if ((await refreshPending()).length > 0) openSyncReview()
}
