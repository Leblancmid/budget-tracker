import api from './axios'
import type { BalanceAccountConfig, BalanceCurrency, BalanceEntry, MasterDashboardStats } from '@/types'

export const masterDashboardApi = {
  getStats: () => api.get<MasterDashboardStats>('/master/dashboard').then((r) => r.data),
}

export interface BalanceEntryPayload {
  account:     string
  type:        'add' | 'sell'
  amount:      number
  description?: string | null
  date:        string
}

export const balanceEntriesApi = {
  getAll:  ()                                    => api.get<BalanceEntry[]>('/master/balance-entries').then((r) => r.data),
  create:  (data: BalanceEntryPayload)           => api.post<BalanceEntry>('/master/balance-entries', data).then((r) => r.data),
  update:  (id: number, data: BalanceEntryPayload) => api.put<BalanceEntry>(`/master/balance-entries/${id}`, data).then((r) => r.data),
  delete:  (id: number)                          => api.delete<{ message: string }>(`/master/balance-entries/${id}`).then((r) => r.data),
}

export interface BalanceAccountPayload {
  name: string
  currency: BalanceCurrency
  color: string
  icon: string
  /** % a year, credited daily; null = no interest */
  interest_rate?: number | null
  /** % withheld as tax from the interest */
  interest_tax?: number
}

export interface BalanceTransferPayload {
  from_account: string
  to_account: string
  amount: number
  /** Only across currencies: what arrived, in the receiving account's currency */
  received?: number | null
  fee?: number | null
  date: string
  note?: string | null
}

export const balanceTransfersApi = {
  create: (data: BalanceTransferPayload) => api.post<{ id: number }>('/master/balance-transfers', data).then((r) => r.data),
  delete: (id: number) => api.delete<{ message: string }>(`/master/balance-transfers/${id}`).then((r) => r.data),
}

export const balanceAccountsApi = {
  getAll:  () => api.get<BalanceAccountConfig[]>('/master/balance-accounts').then((r) => r.data),
  create:  (data: BalanceAccountPayload) => api.post<BalanceAccountConfig>('/master/balance-accounts', data).then((r) => r.data),
  update:  (id: number, data: Partial<BalanceAccountPayload> & { hidden?: boolean }) =>
    api.put<BalanceAccountConfig>(`/master/balance-accounts/${id}`, data).then((r) => r.data),
  reorder: (ids: number[]) => api.post<BalanceAccountConfig[]>('/master/balance-accounts/reorder', { ids }).then((r) => r.data),
  delete:  (id: number) => api.delete<{ message: string }>(`/master/balance-accounts/${id}`).then((r) => r.data),
  /** Bank check: match the account to what the bank shows; the difference becomes one entry */
  check:   (id: number, actual: number, note?: string | null) =>
    api.post<{ difference: number; entry: BalanceEntry | null; account: BalanceAccountConfig }>(`/master/balance-accounts/${id}/check`, { actual, note }).then((r) => r.data),
}

/** One row an action changed, for people (Master File → Undo) */
export interface OperationChange {
  table: string
  /** "sale", "gold stash entry", "wallet entry"… */
  noun: string
  action: 'created' | 'updated' | 'deleted'
  name: string | null
  amount: string | null
  /** For changes: the fields that changed, before → after */
  fields: { field: string; before: string | null; after: string | null }[]
}

/** One thing done in the app, undoable as a whole */
export interface Operation {
  id: number
  label: string
  /** Who did it ("Scheduler" for automatic jobs) */
  user: string
  created_at: string
  undone_at: string | null
  undone_by: string | null
  changes: OperationChange[]
}

export interface OperationPage {
  data: Operation[]
  current_page: number
  last_page: number
  per_page: number
  from: number | null
  to: number | null
  total: number
}

/** Master File → Undo: everything done in the app, newest first */
export const operationsApi = {
  list: (page: number) => api.get<OperationPage>('/master/operations', { params: { page } }).then((r) => r.data),
  undo: (id: number) => api.post<{ message: string }>(`/master/operations/${id}/undo`).then((r) => r.data),
  redo: (id: number) => api.post<{ message: string }>(`/master/operations/${id}/redo`).then((r) => r.data),
}
