import api from './axios'
import type { AccountPayment, AccountPaymentMethod, AccountPaymentStatus, Gold, GoldLog, MiddlemanFee, MiddlemanFeeIndex, RucoyAccount, RucoyDashboardStats, Trade, TradeCurrency, TradePaymentMethod, TradeStatus } from '@/types'

export interface TradePayload {
  description?: string
  status: TradeStatus
  amount: number
  currency?: TradeCurrency | null
  payment_method?: TradePaymentMethod | null
  middleman_fee?: number | null
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

/** Set the stash to the gold actually on hand; records one correction for the difference. */
export const goldStashApi = {
  adjust: (actual: number, description?: string) =>
    api.post<{ previous: number; delta: number; stash: number }>('/rucoy/golds/adjust', { actual, description: description || null }).then((r) => r.data),
}

export const goldLogsApi = {
  getAll:  ()           => api.get<GoldLog[]>('/rucoy/gold-logs').then((r) => r.data),
  cancel:  (id: number) => api.post<GoldLog>(`/rucoy/gold-logs/${id}/cancel`).then((r) => r.data),
}

export const middlemanFeesApi = {
  getAll:  ()                                        => api.get<MiddlemanFeeIndex>('/rucoy/middleman-fees').then((r) => r.data),
  create:  (amount: number, description?: string)    => api.post<MiddlemanFee>('/rucoy/middleman-fees', { amount, description }).then((r) => r.data),
  delete:  (id: number)                              => api.delete<{ message: string }>(`/rucoy/middleman-fees/${id}`).then((r) => r.data),
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
  unarchive: (id: number) =>
    api.post<Trade>(`/rucoy/trades/${id}/unarchive`).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ message: string }>(`/rucoy/trades/${id}`).then((r) => r.data),
}

export interface AccountPayload {
  email: string
  description?: string
  avatar?: File | null
  price?: number | null
  cost?: number | null
  payment_status?: AccountPaymentStatus
  payment_date?: string | null
  level?: number | null
  melee?: number | null
  distance?: number | null
  magic?: number | null
  defense?: number | null
  deal_type?: 'gold' | 'cash'
  price_cash?: number | null
  cost_cash?: number | null
  cash_currency?: 'PHP' | 'USD' | null
  /** Accessory keys; an empty list clears them */
  accessories?: string[]
  /** A new screenshot to upload */
  screenshot?: File | null
  /** Delete the current screenshot */
  remove_screenshot?: boolean
  show_price?: boolean
}

const LISTING_NUMBERS = ['level', 'melee', 'distance', 'magic', 'defense'] as const

function buildAccountForm(data: AccountPayload, method?: 'PUT'): FormData {
  const fd = new FormData()
  if (method) fd.append('_method', method)
  fd.append('email', data.email)
  if (data.description !== undefined) fd.append('description', data.description)
  if (data.avatar instanceof File) fd.append('avatar', data.avatar)
  if (data.price != null) fd.append('price', String(data.price))
  if (data.cost != null) fd.append('cost', String(data.cost))
  if (data.payment_status) fd.append('payment_status', data.payment_status)
  if (data.payment_date !== undefined) fd.append('payment_date', data.payment_date ?? '')
  // '' reaches Laravel as null, which clears a stat that was removed
  for (const key of LISTING_NUMBERS) {
    if (data[key] !== undefined) fd.append(key, data[key] != null ? String(data[key]) : '')
  }
  if (data.deal_type) fd.append('deal_type', data.deal_type)
  for (const key of ['price_cash', 'cost_cash', 'cash_currency'] as const) {
    if (data[key] !== undefined) fd.append(key, data[key] != null ? String(data[key]) : '')
  }
  if (data.accessories !== undefined) {
    // FormData can't carry an empty list; '' reaches Laravel as null, which clears them
    if (data.accessories.length) data.accessories.forEach((key) => fd.append('accessories[]', key))
    else fd.append('accessories', '')
  }
  if (data.screenshot instanceof File) fd.append('screenshot', data.screenshot)
  else if (data.remove_screenshot) fd.append('remove_screenshot', '1')
  if (data.show_price !== undefined) fd.append('show_price', data.show_price ? '1' : '0')
  return fd
}

/**
 * The shared client defaults to JSON, and axios turns FormData into JSON under that header,
 * which silently drops files. Multipart keeps them; the browser adds the boundary itself.
 */
export const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } } as const

export interface AccountPaymentPayload {
  method: AccountPaymentMethod
  gold: number
  date: string
  note?: string | null
  source_trade_id?: number
  balance_account?: string
  cash_amount?: number
  php_rate?: number | null
}

export const accountPaymentsApi = {
  create: (accountId: number, data: AccountPaymentPayload) =>
    api.post<AccountPayment>(`/rucoy/accounts/${accountId}/payments`, data).then((r) => r.data),
  delete: (accountId: number, paymentId: number) =>
    api.delete<{ message: string }>(`/rucoy/accounts/${accountId}/payments/${paymentId}`).then((r) => r.data),
}

export const rucoyAccountsApi = {
  getAll: () => api.get<RucoyAccount[]>('/rucoy/accounts').then((r) => r.data),
  getArchived: () => api.get<RucoyAccount[]>('/rucoy/accounts/archived').then((r) => r.data),
  create: (data: AccountPayload) =>
    api.post<RucoyAccount>('/rucoy/accounts', buildAccountForm(data), MULTIPART).then((r) => r.data),
  update: (id: number, data: AccountPayload) =>
    api.post<RucoyAccount>(`/rucoy/accounts/${id}`, buildAccountForm(data, 'PUT'), MULTIPART).then((r) => r.data),
  archive: (id: number) =>
    api.post<RucoyAccount>(`/rucoy/accounts/${id}/archive`).then((r) => r.data),
  unarchive: (id: number) =>
    api.post<RucoyAccount>(`/rucoy/accounts/${id}/unarchive`).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ message: string }>(`/rucoy/accounts/${id}`).then((r) => r.data),
}
