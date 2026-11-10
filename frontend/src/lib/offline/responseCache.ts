import { clearStore, entries, getItem, removeItem, setItem } from './localStore'

/**
 * The last answer the server gave for each page's data, kept on the device so pages still show
 * something without a connection. Keyed per user, so a different login never sees another's data;
 * wiped on logout.
 */

export interface SavedResponse {
  data: unknown
  savedAt: number
}

/** Copies older than this are dropped (the page would mostly be out of date anyway). */
const KEEP_DAYS = 60

export const responseKey = (userId: number | string, url: string) => `${userId}|${url}`

export function saveResponse(key: string, data: unknown, now = Date.now()): Promise<void> {
  return setItem('responses', key, { data, savedAt: now } satisfies SavedResponse)
}

export function savedResponse(key: string): Promise<SavedResponse | undefined> {
  return getItem<SavedResponse>('responses', key)
}

/** Drop copies older than KEEP_DAYS. */
export async function pruneResponses(now = Date.now()): Promise<number> {
  const cutoff = now - KEEP_DAYS * 86_400_000
  const old = (await entries<SavedResponse>('responses')).filter(([, v]) => !v || v.savedAt < cutoff)
  await Promise.all(old.map(([k]) => removeItem('responses', k)))
  return old.length
}

export const clearResponses = () => clearStore('responses')
