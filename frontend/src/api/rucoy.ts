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

export interface AccountPayload {
  email: string
  description?: string
  avatar?: File | null
  price?: number | null
  cost?: number | null
}

function buildAccountForm(data: AccountPayload, method?: 'PUT'): FormData {
  const fd = new FormData()
  if (method) fd.append('_method', method)
  fd.append('email', data.email)
  if (data.description !== undefined) fd.append('description', data.description)
  if (data.avatar instanceof File) fd.append('avatar', data.avatar)
  if (data.price != null) fd.append('price', String(data.price))
  if (data.cost != null) fd.append('cost', String(data.cost))
  return fd
}

export const rucoyAccountsApi = {
  getAll: () => api.get<RucoyAccount[]>('/rucoy/accounts').then((r) => r.data),
  create: (data: AccountPayload) =>
    api.post<RucoyAccount>('/rucoy/accounts', buildAccountForm(data)).then((r) => r.data),
  update: (id: number, data: AccountPayload) =>
    api.post<RucoyAccount>(`/rucoy/accounts/${id}`, buildAccountForm(data, 'PUT')).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ message: string }>(`/rucoy/accounts/${id}`).then((r) => r.data),
}
