import { formatCurrency } from '@/utils/format'
import type { PendingEntry } from './outbox'

/**
 * What a change made offline does, in words, for the review list before it's sent:
 * "Sell account “Leblanc 621 Dist”", "Add sale “9/100 Crash”", "Delete wallet entry #42".
 */

interface Route {
  method: string
  pattern: RegExp
  /** {name} = the record's name (from the change itself or what's saved on the device); {id} = its number */
  label: string
  /** Where the record lives in saved pages, to find its name for an edit or delete */
  noun?: string
}

const R = (method: string, path: string, label: string): Route => ({
  method,
  pattern: new RegExp('^' + path.replace(/\{id\}/g, '(\\d+)') + '$'),
  label,
})

/** Most specific first */
export const ROUTES: Route[] = [
  // Business: sales and gold trades
  R('POST', '/business/transactions/{id}/sell', 'Sell gold from {name}'),
  R('POST', '/business/transactions/{id}/add-gold', 'Add gold to {name}'),
  R('POST', '/business/transactions/{id}/archive', 'Mark {name} as sold'),
  R('POST', '/business/transactions/{id}/unarchive', 'Mark {name} as not sold'),
  R('PUT', '/business/transactions/{id}', 'Edit sale {name}'),
  R('DELETE', '/business/transactions/{id}', 'Delete sale {name}'),
  R('POST', '/business/transactions', 'Add sale {name}'),
  R('PUT', '/business/website-gold', 'Change the website gold rates'),
  R('PATCH', '/business/leads/{id}', 'Update lead #{id}'),
  R('DELETE', '/business/website-alerts/{id}', 'Remove "Notify me" request #{id}'),
  // Rucoy: accounts, payments, gold stash, trades, fees
  R('DELETE', '/rucoy/accounts/{id}/payments/{id}', 'Remove a payment from {name}'),
  R('POST', '/rucoy/accounts/{id}/payments', 'Add a payment to {name}'),
  R('POST', '/rucoy/accounts/{id}/archive', 'Sell account {name}'),
  R('POST', '/rucoy/accounts/{id}/unarchive', 'Mark account {name} as not sold'),
  R('POST', '/rucoy/accounts/{id}', 'Edit account {name}'),
  R('PUT', '/rucoy/accounts/{id}', 'Edit account {name}'),
  R('DELETE', '/rucoy/accounts/{id}', 'Delete account {name}'),
  R('POST', '/rucoy/accounts', 'Add account {name}'),
  R('POST', '/rucoy/golds/sell', 'Sell gold from the stash'),
  R('POST', '/rucoy/golds/adjust', 'Correct the gold stash'),
  R('POST', '/rucoy/gold-logs/{id}/cancel', 'Undo gold history entry {name}'),
  R('PUT', '/rucoy/golds/{id}', 'Edit stash entry {name}'),
  R('DELETE', '/rucoy/golds/{id}', 'Delete stash entry {name}'),
  R('POST', '/rucoy/golds', 'Add to the gold stash {name}'),
  R('POST', '/rucoy/trades/{id}/archive', 'Complete trade {name}'),
  R('POST', '/rucoy/trades/{id}/unarchive', 'Reopen trade {name}'),
  R('PUT', '/rucoy/trades/{id}', 'Edit trade {name}'),
  R('DELETE', '/rucoy/trades/{id}', 'Delete trade {name}'),
  R('POST', '/rucoy/trades', 'Add trade {name}'),
  R('DELETE', '/rucoy/middleman-fees/{id}', 'Delete middleman fee {name}'),
  R('POST', '/rucoy/middleman-fees', 'Add middleman fee {name}'),
  // Wallets
  R('POST', '/master/balance-accounts/reorder', 'Reorder wallets'),
  R('POST', '/master/balance-accounts/{id}/check', 'Bank check: {name}'),
  R('PUT', '/master/balance-accounts/{id}', 'Edit wallet {name}'),
  R('DELETE', '/master/balance-accounts/{id}', 'Delete wallet {name}'),
  R('POST', '/master/balance-accounts', 'Add wallet {name}'),
  R('PUT', '/master/balance-entries/{id}', 'Edit wallet entry {name}'),
  R('DELETE', '/master/balance-entries/{id}', 'Delete wallet entry {name}'),
  R('POST', '/master/balance-entries', 'Add wallet entry {name}'),
  R('DELETE', '/master/balance-transfers/{id}', 'Delete transfer #{id}'),
  R('POST', '/master/balance-transfers', 'Transfer between wallets'),
  // Daily Expenses: budgets, categories, recurring
  R('PUT', '/budgets/{id}', 'Edit budget #{id}'),
  R('DELETE', '/budgets/{id}', 'Delete budget #{id}'),
  R('POST', '/budgets', 'Add budget'),
  R('PUT', '/categories/{id}', 'Edit category {name}'),
  R('DELETE', '/categories/{id}', 'Delete category {name}'),
  R('POST', '/categories', 'Add category {name}'),
  R('PUT', '/recurring-entries/{id}', 'Edit recurring entry {name}'),
  R('DELETE', '/recurring-entries/{id}', 'Delete recurring entry {name}'),
  R('POST', '/recurring-entries', 'Add recurring entry {name}'),
]

/** A record's name from its fields: description, name, email or code. */
export function nameOf(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  const name = [v.description, v.name, v.email, v.code].find((x) => typeof x === 'string' && x.trim() !== '')
  return typeof name === 'string' ? name.trim().slice(0, 60) : null
}

/** The fields sent (JSON), or the text fields of a form with a file. */
export function fieldsOf(body: unknown): Record<string, unknown> | null {
  if (typeof body === 'string') {
    try { return JSON.parse(body) } catch { return null }
  }
  if (Array.isArray(body)) {
    return Object.fromEntries(body.filter(([, v]) => typeof v === 'string'))
  }
  return body && typeof body === 'object' ? body as Record<string, unknown> : null
}

/** Account forms are sent as POST with _method=PUT (a screenshot can be attached) */
function effectiveMethod(method: string, fields: Record<string, unknown> | null): string {
  const override = fields?._method
  return typeof override === 'string' ? override.toUpperCase() : method.toUpperCase()
}

/**
 * "Edit sale “Leblanc 621 Dist”". `lookup` finds the name of an existing record (by its id) in
 * what's saved on the device, for edits and deletes whose request doesn't carry it.
 */
export function describeRequest(method: string, url: string, body: unknown, lookup?: (id: number) => string | null): string {
  const path = url.split('?')[0]
  const fields = fieldsOf(body)
  const m = effectiveMethod(method, fields)
  const route = ROUTES.find((r) => r.method === m && r.pattern.test(path))
  if (!route) return `${m} ${path}`

  const ids = (path.match(/\d+/g) ?? []).map(Number)
  const id = ids[0]
  const name = nameOf(fields) ?? (id !== undefined ? lookup?.(id) ?? null : null)
  const named = name ? `“${name}”` : id !== undefined ? `#${id}` : ''
  const label = route.label.replace('{name}', named).replace('{id}', String(id ?? '')).replace(/\s+/g, ' ').trim()
  // No name to show (e.g. a gold trade from Quick Add): say how much gold instead
  const gold = name ? null : goldOf(fields)
  return gold ? `${label} · ${gold}` : label
}

/** "500KK gold", "1.25KKK gold" from a change's gold amount, if it has one. */
function goldOf(fields: Record<string, unknown> | null): string | null {
  const raw = fields?.price_gold ?? fields?.gold ?? fields?.cost_gold
  const n = Number(raw)
  if (raw == null || !Number.isFinite(n) || n <= 0) return null
  const short = n >= 1e9 ? `${+(n / 1e9).toFixed(2)}KKK` : n >= 1e6 ? `${+(n / 1e6).toFixed(2)}KK` : n.toLocaleString('en')
  return `${short} gold`
}

/** What a change does, in words: "Add expense “Lunch”", "Sell account “Leblanc 621 Dist”". */
export function describeEntry(e: PendingEntry): { label: string; amount: string | null } {
  if ((e.kind ?? 'create') === 'request') return { label: e.label ?? `${e.method} ${e.url}`, amount: null }
  const p = e.payload!
  const what = p.type === 'income' ? 'income' : 'expense'
  const name = p.description ? ` “${p.description}”` : ''
  const verb = (e.kind ?? 'create') === 'update' ? 'Edit' : (e.kind ?? 'create') === 'delete' ? 'Delete' : 'Add'
  return { label: `${verb} ${what}${name}`, amount: formatCurrency(p.amount) }
}
