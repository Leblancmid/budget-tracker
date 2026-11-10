import { useSyncExternalStore } from 'react'
import api from '@/api/axios'
import type { TransactionPayload } from '@/api/transactions'
import { loadSession } from '@/lib/authSession'
import { emitDataChanged } from '@/lib/dataEvents'
import { errorMessage, flattenApiErrors, isOfflineError, type ApiError } from '@/utils/api'
import { entries, removeItem, setItem } from './localStore'

/**
 * Daily entries (expenses and income) added, edited or deleted without a connection. Each change is
 * kept on the device and sent in the order it was made once the server can be reached.
 * - New entries carry an id made on the device, so one sent twice (the answer got lost) is saved once.
 * - Editing the same entry again replaces the waiting edit; deleting it drops its waiting edits.
 */
export type PendingKind = 'create' | 'update' | 'delete'

export interface PendingEntry {
  /** Id of this change (for a new entry, also the id the server saves it under) */
  client_id: string
  user_id: number
  /** Stored before edits/deletes were supported: a missing kind means 'create' */
  kind?: PendingKind
  /** The server's id of the entry being edited or deleted */
  transaction_id?: number
  /** The entry's values (new entry, or after the edit); for a delete, what's being deleted */
  payload: TransactionPayload
  /** When it was made on the device (ms) */
  created_at: number
  /** Why the server refused it (it stays until you try again or discard it); null while waiting */
  error: string | null
}

export interface SyncResult {
  sent: number
  refused: number
}

export const kindOf = (e: PendingEntry): PendingKind => e.kind ?? 'create'

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

// ── The signed-in user's waiting changes, for the screens ───────────────────────────────────────
let pending: PendingEntry[] = []
const listeners = new Set<() => void>()
const currentUserId = () => loadSession()?.user.id ?? null

/** Reload the list from the device (only the signed-in user's changes). */
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

function signedInUser(): number {
  const userId = currentUserId()
  if (userId === null) throw { message: 'Sign in again to save this.' } satisfies ApiError
  return userId
}

/** Keep a new entry on the device to send later. */
export async function queueEntry(payload: TransactionPayload, clientId = newClientId(), now = Date.now()): Promise<PendingEntry> {
  const entry: PendingEntry = { client_id: clientId, user_id: signedInUser(), kind: 'create', payload, created_at: now, error: null }
  await setItem('outbox', keyOf(entry), entry)
  await refreshPending()
  return entry
}

/** Keep an edit (or delete) of an existing entry on the device to send later. */
export async function queueChange(kind: 'update' | 'delete', transactionId: number, payload: TransactionPayload, now = Date.now()): Promise<PendingEntry> {
  const userId = signedInUser()
  const sameEntry = (await refreshPending()).filter((e) => e.transaction_id === transactionId && kindOf(e) !== 'create')

  // Edited again: one waiting edit with the latest values, at its original place in the queue
  const waitingEdit = sameEntry.find((e) => kindOf(e) === 'update' && e.error === null)
  if (kind === 'update' && waitingEdit) {
    const merged = { ...waitingEdit, payload: { ...waitingEdit.payload, ...payload } }
    await setItem('outbox', keyOf(merged), merged)
    await refreshPending()
    return merged
  }
  // Deleted: its waiting edits no longer matter
  if (kind === 'delete') await Promise.all(sameEntry.map((e) => removeItem('outbox', keyOf(e))))

  const entry: PendingEntry = { client_id: newClientId(), user_id: userId, kind, transaction_id: transactionId, payload, created_at: now, error: null }
  await setItem('outbox', keyOf(entry), entry)
  await refreshPending()
  return entry
}

export async function discardEntry(entry: PendingEntry): Promise<void> {
  await removeItem('outbox', keyOf(entry))
  await refreshPending()
}

/** Send a refused change again (e.g. after fixing what was wrong on the server side). */
export async function retryEntry(entry: PendingEntry): Promise<SyncResult> {
  await setItem('outbox', keyOf(entry), { ...entry, error: null })
  await refreshPending()
  return syncPending()
}

// ── Sending ──────────────────────────────────────────────────────────────────────────────────────
function send(entry: PendingEntry): Promise<unknown> {
  switch (kindOf(entry)) {
    case 'update': return api.put(`/transactions/${entry.transaction_id}`, entry.payload)
    case 'delete': return api.delete(`/transactions/${entry.transaction_id}`)
    default:       return api.post('/transactions', { ...entry.payload, client_id: entry.client_id })
  }
}

/** Why the server said no, in words for the list. */
function refusal(err: unknown): string {
  if ((err as ApiError).status === 404) return 'It was deleted somewhere else in the meantime.'
  const fields = flattenApiErrors(err)
  return fields ? Object.values(fields).join(' ') : errorMessage(err)
}

let running: Promise<SyncResult> | null = null

/**
 * Send every waiting change, oldest first. Stops at the first one that can't get through (still
 * offline, or the server is having trouble) and tries again next time; a change the server refuses
 * (e.g. its category was deleted meanwhile) is marked with the reason and the rest carry on.
 * Deleting something that's already gone counts as done.
 */
export function syncPending(): Promise<SyncResult> {
  if (running) return running
  running = (async () => {
    const result: SyncResult = { sent: 0, refused: 0 }
    for (const entry of await refreshPending()) {
      if (entry.error !== null) continue
      try {
        await send(entry)
        await removeItem('outbox', keyOf(entry))
        result.sent++
      } catch (err) {
        if (isOfflineError(err)) break
        const status = (err as ApiError).status ?? 0
        if (status >= 500 || status === 429 || status === 401) break
        if (kindOf(entry) === 'delete' && status === 404) {
          await removeItem('outbox', keyOf(entry))
          result.sent++
          continue
        }
        await setItem('outbox', keyOf(entry), { ...entry, error: refusal(err) })
        result.refused++
      }
    }
    await refreshPending()
    if (result.sent > 0) emitDataChanged()
    return result
  })().finally(() => { running = null })
  return running
}
