import api from './axios'
import type { Gold, GoldLog, RucoyAccount, RucoyDashboardStats, Trade, TradeCurrency, TradePaymentMethod, TradeStatus } from '@/types'

export interface TradePayload {
  description?: string
  status: TradeStatus
  amount: number
  currency?: TradeCurrency | null
  payment_method?: TradePaymentMethod | null
  completion_date?: string | null
}

export const rucoyDashboardApi = {
  getStats: () =>
    api.get<RucoyDashboardStats>('/rucoy/dashboard').then((r) => r.data),
}

export interface GoldPayload {
  amount: number
  description?: string
}

export const goldsApi = {
  getAll: () => api.get<Gold[]>('/rucoy/golds').then((r) => r.data),
  create: (data: GoldPayload) =>
    api.post<Gold>('/rucoy/golds', data).then((r) => r.data),
  update: (id: number, data: GoldPayload) =>
    api.put<Gold>(`/rucoy/golds/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ message: string }>(`/rucoy/golds/${id}`).then((r) => r.data),
  sell: (amount: number, description?: string) =>
    api.post<Gold[]>('/rucoy/golds/sell', { amount, description }).then((r) => r.data),
}

export const goldLogsApi = {
  getAll: () => api.get<GoldLog[]>('/rucoy/gold-logs').then((r) => r.data),
}

export const tradesApi = {
  getAll: () => api.get<Trade[]>('/rucoy/trades').then((r) => r.data),
  getArchived: () => api.get<Trade[]>('/rucoy/trades/archived').then((r) => r.data),
  create: (data: TradePayload) =>
    api.post<Trade>('/rucoy/trades', data).then((r) => r.data),
  update: (id: number, data: TradePayload) =>
    api.put<Trade>(`/rucoy/trades/${id}`, data).then((r) => r.data),
  archive: (id: number) =>
    api.post<Trade>(`/rucoy/trades/${id}/archive`).then((r) => r.data),
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
  getArchived: () => api.get<RucoyAccount[]>('/rucoy/accounts/archived').then((r) => r.data),
  create: (data: AccountPayload) =>
    api.post<RucoyAccount>('/rucoy/accounts', buildAccountForm(data)).then((r) => r.data),
  update: (id: number, data: AccountPayload) =>
    api.post<RucoyAccount>(`/rucoy/accounts/${id}`, buildAccountForm(data, 'PUT')).then((r) => r.data),
  archive: (id: number) =>
    api.post<RucoyAccount>(`/rucoy/accounts/${id}/archive`).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ message: string }>(`/rucoy/accounts/${id}`).then((r) => r.data),
}
