import { useSyncExternalStore } from 'react'
import api, { onOfflineWrite, type OfflineWrite } from '@/api/axios'
import type { TransactionPayload } from '@/api/transactions'
import { loadSession } from '@/lib/authSession'
import { emitDataChanged } from '@/lib/dataEvents'
import { errorMessage, flattenApiErrors, isOfflineError, type ApiError } from '@/utils/api'
import { newClientId } from './clientId'
import { describeRequest, nameOf } from './describeRequest'
import { entries, removeItem, setItem } from './localStore'
import type { SavedResponse } from './responseCache'

/**
 * Changes made without a connection, kept on the device until you approve sending them.
 * Nothing is sent on its own: when the connection is back the app asks first (SyncReviewDialog),
 * and only the changes you approve are sent, in the order they were made.
 * - Daily entries (create / update / delete) are kept with their values, so the Transactions list
 *   can show them straight away (see applyPending).
 * - Everything else (sales, accounts, gold, trades, wallets…) is kept as the request itself
 *   ('request'), described in words for the review list.
 * - Every change carries an id made on the device and is sent with it as the Idempotency-Key, so a
 *   resend after a lost answer is done only once.
 */
export type PendingKind = 'create' | 'update' | 'delete' | 'request'

export interface PendingEntry {
  /** Id of this change, sent as its Idempotency-Key (for a new daily entry, also its client_id) */
  client_id: string
  user_id: number
  /** Stored before edits/deletes were supported: a missing kind means 'create' */
  kind?: PendingKind
  /** Daily entries: the server's id of the entry being edited or deleted */
  transaction_id?: number
  /** Daily entries: the values (new entry, or after the edit); for a delete, what's being deleted */
  payload?: TransactionPayload
  /** Other changes: the request to send */
  method?: string
  url?: string
  /** JSON text, or a form's fields (with any file) as [name, value] pairs */
  body?: string | [string, string | Blob][] | null
  /** What it does, in words ("Sell account “Leblanc 621 Dist”") */
  label?: string
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
export const isDailyEntry = (e: PendingEntry) => kindOf(e) !== 'request'

export { newClientId }

/** Stored in the order they were made */
let lastMadeAt = 0

/** Date.now(), but never the same twice: changes made in the same millisecond keep their order. */
export function madeAt(now = Date.now()): number {
  lastMadeAt = Math.max(now, lastMadeAt + 1)
  return lastMadeAt
}

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

async function store(entry: PendingEntry): Promise<PendingEntry> {
  await setItem('outbox', keyOf(entry), entry)
  await refreshPending()
  return entry
}

/** Keep a new daily entry on the device to send later. */
export async function queueEntry(payload: TransactionPayload, clientId = newClientId(), now = madeAt()): Promise<PendingEntry> {
  return store({ client_id: clientId, user_id: signedInUser(), kind: 'create', payload, created_at: now, error: null })
}

/** Keep an edit (or delete) of an existing daily entry on the device to send later. */
export async function queueChange(kind: 'update' | 'delete', transactionId: number, payload: TransactionPayload, now = madeAt()): Promise<PendingEntry> {
  const userId = signedInUser()
  const sameEntry = (await refreshPending()).filter((e) => e.transaction_id === transactionId && (kindOf(e) === 'update' || kindOf(e) === 'delete'))

  // Edited again: one waiting edit with the latest values, at its original place in the queue
  const waitingEdit = sameEntry.find((e) => kindOf(e) === 'update' && e.error === null)
  if (kind === 'update' && waitingEdit) {
    return store({ ...waitingEdit, payload: { ...waitingEdit.payload!, ...payload } })
  }
  // Deleted: its waiting edits no longer matter
  if (kind === 'delete') await Promise.all(sameEntry.map((e) => removeItem('outbox', keyOf(e))))

  return store({ client_id: newClientId(), user_id: userId, kind, transaction_id: transactionId, payload, created_at: now, error: null })
}

/** The name of record #id from pages saved on the device under this path ("/business/transactions"). */
async function savedName(basePath: string, id: number): Promise<string | null> {
  const find = (value: unknown, depth: number): string | null => {
    if (!value || typeof value !== 'object' || depth > 4) return null
    if (Array.isArray(value)) {
      for (const v of value) { const n = find(v, depth + 1); if (n) return n }
      return null
    }
    const v = value as Record<string, unknown>
    if (v.id === id) return nameOf(v)
    for (const child of Object.values(v)) { const n = find(child, depth + 1); if (n) return n }
    return null
  }
  for (const [key, saved] of await entries<SavedResponse>('responses')) {
    if (!key.includes(basePath)) continue
    const n = find(saved?.data, 0)
    if (n) return n
  }
  return null
}

/** Keep any other change (a sale, an account, a wallet entry…) on the device to send later. */
export async function queueRequest(write: OfflineWrite, now = madeAt()): Promise<PendingEntry> {
  const userId = signedInUser()
  const body = write.data instanceof FormData ? [...write.data.entries()] as [string, string | Blob][]
    : typeof write.data === 'string' ? write.data
    : write.data == null ? null : JSON.stringify(write.data)
  // Its name for edits and deletes: "/business/transactions/12/sell" → sale #12 in the saved Sales pages
  const id = write.url.match(/\/(\d+)/)?.[1]
  const basePath = id ? write.url.slice(0, write.url.indexOf(`/${id}`)) : null
  const name = id && basePath ? await savedName(basePath, Number(id)) : null
  const label = describeRequest(write.method, write.url, body, () => name)
  // The same key as the first try: if that one did reach the server, sending it again isn't done twice
  return store({ client_id: write.key ?? newClientId(), user_id: userId, kind: 'request', method: write.method.toUpperCase(), url: write.url, body, label, created_at: now, error: null })
}
// Every change made offline (outside Daily Expenses, which handles its own) is kept here
onOfflineWrite(queueRequest)

export async function discardEntry(entry: PendingEntry): Promise<void> {
  await removeItem('outbox', keyOf(entry))
  await refreshPending()
}

/** Discard several at once (from the review window). */
export async function discardEntries(chosen: PendingEntry[]): Promise<void> {
  await Promise.all(chosen.map((e) => removeItem('outbox', keyOf(e))))
  await refreshPending()
}

// ── Sending (only what you approved) ─────────────────────────────────────────────────────────────
function rebuild(body: PendingEntry['body']): unknown {
  if (!Array.isArray(body)) return body ?? undefined
  const form = new FormData()
  for (const [name, value] of body) form.append(name, value)
  return form
}

function send(entry: PendingEntry): Promise<unknown> {
  const config = { offlineQueue: false, headers: { 'Idempotency-Key': entry.client_id } as Record<string, string> }
  switch (kindOf(entry)) {
    case 'update': return api.put(`/transactions/${entry.transaction_id}`, entry.payload, config)
    case 'delete': return api.delete(`/transactions/${entry.transaction_id}`, config)
    case 'request': {
      if (Array.isArray(entry.body)) config.headers['Content-Type'] = 'multipart/form-data'
      return api.request({ ...config, method: entry.method, url: entry.url, data: rebuild(entry.body) })
    }
    default: return api.post('/transactions', { ...entry.payload, client_id: entry.client_id }, config)
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
 * Send the approved changes (`approved`: their client_ids), oldest first. Stops at the first one that
 * can't get through (offline again, or the server is having trouble): the rest stay for next time.
 * A change the server refuses (e.g. the account was sold meanwhile) is kept with the reason and the
 * others carry on. Deleting something that's already gone counts as done.
 */
export function syncPending(approved: Iterable<string>): Promise<SyncResult> {
  if (running) return running
  const chosen = new Set(approved)
  running = (async () => {
    const result: SyncResult = { sent: 0, refused: 0 }
    for (const entry of await refreshPending()) {
      if (!chosen.has(entry.client_id)) continue
      try {
        await send(entry)
        await removeItem('outbox', keyOf(entry))
        result.sent++
      } catch (err) {
        if (isOfflineError(err)) break
        const status = (err as ApiError).status ?? 0
        if (status >= 500 || status === 429 || status === 401) break
        const method = kindOf(entry) === 'request' ? entry.method : kindOf(entry) === 'delete' ? 'DELETE' : ''
        if (method === 'DELETE' && status === 404) {
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
