/**
 * A small key/value store on the device (IndexedDB), for what the app keeps while offline.
 * Every call is safe: if IndexedDB is unavailable (private mode, tests) it falls back to memory
 * for this visit, and failures never break the page.
 */

const DB_NAME = 'budget-offline'
const DB_VERSION = 1
export type StoreName = 'responses'
const STORES: StoreName[] = ['responses']

let dbPromise: Promise<IDBDatabase | null> | null = null
const memory = new Map<StoreName, Map<string, unknown>>(STORES.map((s) => [s, new Map()]))

function db(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null)
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        for (const s of STORES) if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

function run<T>(store: StoreName, mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return db().then((d) => {
    if (!d) return undefined
    return new Promise<T | undefined>((resolve) => {
      try {
        const req = op(d.transaction(store, mode).objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => resolve(undefined)
      } catch {
        resolve(undefined)
      }
    })
  })
}

export async function getItem<T>(store: StoreName, key: string): Promise<T | undefined> {
  if (!(await db())) return memory.get(store)!.get(key) as T | undefined
  return run<T>(store, 'readonly', (s) => s.get(key) as IDBRequest<T>)
}

export async function setItem(store: StoreName, key: string, value: unknown): Promise<void> {
  if (!(await db())) { memory.get(store)!.set(key, value); return }
  await run(store, 'readwrite', (s) => s.put(value, key))
}

export async function removeItem(store: StoreName, key: string): Promise<void> {
  if (!(await db())) { memory.get(store)!.delete(key); return }
  await run(store, 'readwrite', (s) => s.delete(key))
}

/** Every [key, value] in a store, in key order. */
export async function entries<T>(store: StoreName): Promise<[string, T][]> {
  if (!(await db())) return [...memory.get(store)!.entries()].sort(([a], [b]) => a.localeCompare(b)) as [string, T][]
  const keys = (await run(store, 'readonly', (s) => s.getAllKeys())) ?? []
  const values = (await run(store, 'readonly', (s) => s.getAll())) ?? []
  return keys.map((k, i) => [String(k), values[i] as T])
}

export async function clearStore(store: StoreName): Promise<void> {
  if (!(await db())) { memory.get(store)!.clear(); return }
  await run(store, 'readwrite', (s) => s.clear())
}
