import api from './axios'
import type { Gold, RucoyAccount, RucoyDashboardStats, Trade, TradeStatus } from '@/types'

export const rucoyDashboardApi = {
  getStats: () =>
    api.get<RucoyDashboardStats>('/rucoy/dashboard').then((r) => r.data),
}

export const goldsApi = {
  getAll: () => api.get<Gold[]>('/rucoy/golds').then((r) => r.data),
  create: (data: { amount: number }) =>
    api.post<Gold>('/rucoy/golds', data).then((r) => r.data),
  update: (id: number, data: { amount: number }) =>
    api.put<Gold>(`/rucoy/golds/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ message: string }>(`/rucoy/golds/${id}`).then((r) => r.data),
}

export const tradesApi = {
  getAll: () => api.get<Trade[]>('/rucoy/trades').then((r) => r.data),
  create: (data: { gold_id: number; description?: string; status: TradeStatus; amount: number }) =>
    api.post<Trade>('/rucoy/trades', data).then((r) => r.data),
  update: (id: number, data: Partial<{ gold_id: number; description?: string; status: TradeStatus; amount: number }>) =>
    api.put<Trade>(`/rucoy/trades/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ message: string }>(`/rucoy/trades/${id}`).then((r) => r.data),
}

export const rucoyAccountsApi = {
  getAll: () => api.get<RucoyAccount[]>('/rucoy/accounts').then((r) => r.data),
  create: (data: { description?: string; email: string; avatar?: string }) =>
    api.post<RucoyAccount>('/rucoy/accounts', data).then((r) => r.data),
  update: (id: number, data: Partial<{ description?: string; email: string; avatar?: string }>) =>
    api.put<RucoyAccount>(`/rucoy/accounts/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ message: string }>(`/rucoy/accounts/${id}`).then((r) => r.data),
}
