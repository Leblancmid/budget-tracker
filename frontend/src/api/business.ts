import api from './axios'
import type { BusinessTransaction, BusinessDashboardStats, BusinessTransactionType, BusinessTransactionAction } from '@/types'

export const businessDashboardApi = {
  getStats: (month: number, year: number) =>
    api.get<BusinessDashboardStats>('/business/dashboard', { params: { month, year } }).then((r) => r.data),
}

export interface BusinessTransactionPayload {
  type: BusinessTransactionType
  action?: BusinessTransactionAction | null
  account_id?: number | null
  price_rate?: number | null
  cost_rate?: number | null
  php_rate?: number | null
  price_php?: number | null
  cost_php?: number | null
  profit_php?: number | null
  amount: number
  description?: string | null
  date: string
  notes?: string | null
}

export const businessTransactionsApi = {
  getAll:    () => api.get<BusinessTransaction[]>('/business/transactions').then((r) => r.data),
  getArchived: () => api.get<BusinessTransaction[]>('/business/transactions/archived').then((r) => r.data),
  create:    (data: BusinessTransactionPayload) =>
    api.post<BusinessTransaction>('/business/transactions', data).then((r) => r.data),
  update:    (id: number, data: BusinessTransactionPayload) =>
    api.put<BusinessTransaction>(`/business/transactions/${id}`, data).then((r) => r.data),
  archive:   (id: number) =>
    api.post<BusinessTransaction>(`/business/transactions/${id}/archive`).then((r) => r.data),
  unarchive: (id: number) =>
    api.post<BusinessTransaction>(`/business/transactions/${id}/unarchive`).then((r) => r.data),
  delete:    (id: number) =>
    api.delete<{ message: string }>(`/business/transactions/${id}`).then((r) => r.data),
}

