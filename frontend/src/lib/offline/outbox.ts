import { useSyncExternalStore } from 'react'
import api from '@/api/axios'
import type { TransactionPayload } from '@/api/transactions'
import { loadSession } from '@/lib/authSession'
import { emitDataChanged } from '@/lib/dataEvents'
import { errorMessage, flattenApiErrors, isOfflineError, type ApiError } from '@/utils/api'
import { entries, removeItem, setItem } from './localStore'

/**
 * Daily entries (expenses and income) added without a connection. Each is kept on the device with
 * an id made when it was added, then sent in the order it was made once the server can be reached.
 * The server recognises the id, so an entry sent twice (the answer got lost) is saved once.
 */
export interface PendingEntry {
  client_id: string
  user_id: number
  payload: TransactionPayload
  /** When it was added on the device (ms) */
  created_at: number
  /** Why the server refused it (it stays until you try again or discard it); null while waiting */
  error: string | null
}

export interface SyncResult {
  sent: number
  refused: number
}

/** A random id (UUID v4). getRandomValues also works on plain http, unlike crypto.randomUUID. */
export function newClientId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Stored in the order they were made */
const keyOf = (e: Pick<PendingEntry, 'created_at' | 'client_id'>) => `${String(e.created_at).padStart(15, '0')}|${e.client_id}`

// ── The signed-in user's waiting entries, for the screens ───────────────────────────────────────
let pending: PendingEntry[] = []
const listeners = new Set<() => void>()
const currentUserId = () => loadSession()?.user.id ?? null

/** Reload the list from the device (only the signed-in user's entries). */
export async function refreshPending(): Promise<PendingEntry[]> {
  const userId = currentUserId()
  pending = userId === null ? [] : (await entries<PendingEntry>('outbox')).map(([, e]) => e).filter((e) => e?.user_id === userId)
  listeners.forEach((l) => l())
  return pending
}

export function usePendingEntries(): PendingEntry[] {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l) } },
    () => pending,
    () => pending,
  )
}

/** Keep an entry on the device to send later. */
export async function queueEntry(payload: TransactionPayload, clientId = newClientId(), now = Date.now()): Promise<PendingEntry> {
  const userId = currentUserId()
  if (userId === null) throw { message: 'Sign in again to save this.' } satisfies ApiError
  const entry: PendingEntry = { client_id: clientId, user_id: userId, payload, created_at: now, error: null }
  await setItem('outbox', keyOf(entry), entry)
  await refreshPending()
  return entry
}

export async function discardEntry(entry: PendingEntry): Promise<void> {
  await removeItem('outbox', keyOf(entry))
  await refreshPending()
}

/** Send a refused entry again (e.g. after fixing what was wrong on the server side). */
export async function retryEntry(entry: PendingEntry): Promise<SyncResult> {
  await setItem('outbox', keyOf(entry), { ...entry, error: null })
  await refreshPending()
  return syncPending()
}

// ── Sending ──────────────────────────────────────────────────────────────────────────────────────
let running: Promise<SyncResult> | null = null

/**
 * Send every waiting entry, oldest first. Stops at the first one that can't get through (still
 * offline, or the server is having trouble) and tries again next time; an entry the server refuses
 * (e.g. its category was deleted meanwhile) is marked with the reason and the rest carry on.
 */
export function syncPending(): Promise<SyncResult> {
  if (running) return running
  running = (async () => {
    const result: SyncResult = { sent: 0, refused: 0 }
    for (const entry of await refreshPending()) {
      if (entry.error !== null) continue
      try {
        await api.post('/transactions', { ...entry.payload, client_id: entry.client_id })
        await removeItem('outbox', keyOf(entry))
        result.sent++
      } catch (err) {
        if (isOfflineError(err)) break
        const status = (err as ApiError).status ?? 0
        if (status >= 500 || status === 429 || status === 401) break
        const fields = flattenApiErrors(err)
        await setItem('outbox', keyOf(entry), { ...entry, error: fields ? Object.values(fields).join(' ') : errorMessage(err) })
        result.refused++
      }
    }
    await refreshPending()
    if (result.sent > 0) emitDataChanged()
    return result
  })().finally(() => { running = null })
  return running
}
