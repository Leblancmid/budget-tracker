import { emitDataChanged } from '@/lib/dataEvents'
import { markOffline } from './offlineStatus'
import { pruneResponses } from './responseCache'

/**
 * Offline support, started once from main.tsx:
 * - the service worker keeps the app itself on the device (production builds only; browsers allow
 *   it on https:// or localhost),
 * - old saved pages are dropped,
 * - the phone saying it lost / regained its connection updates the offline notice and refreshes the open page.
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
  window.addEventListener('online', () => emitDataChanged())
}
