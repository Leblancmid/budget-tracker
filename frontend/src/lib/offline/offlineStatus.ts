import { useSyncExternalStore } from 'react'

/**
 * Whether the app can reach the server right now, and (while it can't) how old the oldest saved
 * copy on screen is. Set by the API layer: a request that fails for lack of a connection makes it
 * offline, the next one that gets through makes it online again.
 */
export interface OfflineStatus {
  offline: boolean
  /** Oldest saved copy shown since going offline (ms), or null if none was needed */
  showingSince: number | null
}

const ONLINE: OfflineStatus = { offline: false, showingSince: null }
let status: OfflineStatus = ONLINE
const listeners = new Set<() => void>()

function set(next: OfflineStatus): void {
  if (next.offline === status.offline && next.showingSince === status.showingSince) return
  status = next
  listeners.forEach((l) => l())
}

/** A request got through. */
export function markOnline(): void {
  set(ONLINE)
}

/** A request failed for lack of a connection; `savedAt` is when the copy shown instead was saved. */
export function markOffline(savedAt: number | null = null): void {
  const since = savedAt === null ? status.showingSince
    : status.showingSince === null ? savedAt : Math.min(status.showingSince, savedAt)
  set({ offline: true, showingSince: since })
}

export const getOfflineStatus = () => status

export function subscribeOfflineStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function useOfflineStatus(): OfflineStatus {
  return useSyncExternalStore(subscribeOfflineStatus, getOfflineStatus, getOfflineStatus)
}
