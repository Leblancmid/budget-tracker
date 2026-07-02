import api from './axios'
import type { BusinessCategory, BusinessTransaction, BusinessBudget, BusinessDashboardStats, BusinessTransactionType, BusinessTransactionAction } from '@/types'

export const businessDashboardApi = {
  getStats: (month: number, year: number) =>
    api.get<BusinessDashboardStats>('/business/dashboard', { params: { month, year } }).then((r) => r.data),
}

export interface BusinessCategoryPayload {
  name: string
  type: BusinessTransactionType
  color?: string
  icon?: string
}

export const businessCategoriesApi = {
  getAll: () => api.get<BusinessCategory[]>('/business/categories').then((r) => r.data),
  create: (data: BusinessCategoryPayload) =>
    api.post<BusinessCategory>('/business/categories', data).then((r) => r.data),
  update: (id: number, data: Partial<BusinessCategoryPayload>) =>
    api.put<BusinessCategory>(`/business/categories/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ message: string }>(`/business/categories/${id}`).then((r) => r.data),
}

export interface BusinessTransactionPayload {
  category_id?: number | null
  type: BusinessTransactionType
  action?: BusinessTransactionAction | null
  amount: number
  description?: string | null
  date: string
  notes?: string | null
}

export const businessTransactionsApi = {
  getAll: () => api.get<BusinessTransaction[]>('/business/transactions').then((r) => r.data),
  create: (data: BusinessTransactionPayload) =>
    api.post<BusinessTransaction>('/business/transactions', data).then((r) => r.data),
  update: (id: number, data: BusinessTransactionPayload) =>
    api.put<BusinessTransaction>(`/business/transactions/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ message: string }>(`/business/transactions/${id}`).then((r) => r.data),
}

export const businessBudgetsApi = {
  getAll: (month: number, year: number) =>
    api.get<BusinessBudget[]>('/business/budgets', { params: { month, year } }).then((r) => r.data),
  create: (data: { category_id: number; amount: number; month: number; year: number }) =>
    api.post<BusinessBudget>('/business/budgets', data).then((r) => r.data),
  update: (id: number, amount: number) =>
    api.put<BusinessBudget>(`/business/budgets/${id}`, { amount }).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ message: string }>(`/business/budgets/${id}`).then((r) => r.data),
}
