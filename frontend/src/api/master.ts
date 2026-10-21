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
}

export const balanceAccountsApi = {
  getAll:  () => api.get<BalanceAccountConfig[]>('/master/balance-accounts').then((r) => r.data),
  create:  (data: BalanceAccountPayload) => api.post<BalanceAccountConfig>('/master/balance-accounts', data).then((r) => r.data),
  update:  (id: number, data: Partial<BalanceAccountPayload> & { hidden?: boolean }) =>
    api.put<BalanceAccountConfig>(`/master/balance-accounts/${id}`, data).then((r) => r.data),
  reorder: (ids: number[]) => api.post<BalanceAccountConfig[]>('/master/balance-accounts/reorder', { ids }).then((r) => r.data),
  delete:  (id: number) => api.delete<{ message: string }>(`/master/balance-accounts/${id}`).then((r) => r.data),
}
