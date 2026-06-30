import api from './axios'
import type { Paginated, Transaction, TransactionFilters } from '@/types'

export interface TransactionPayload {
  category_id: number
  type: string
  amount: number
  description?: string
  date: string
  notes?: string
}

export const transactionsApi = {
  getAll: (filters: TransactionFilters = {}) =>
    api
      .get<Paginated<Transaction>>('/transactions', { params: filters })
      .then((r) => r.data),

  create: (data: TransactionPayload) =>
    api.post<Transaction>('/transactions', data).then((r) => r.data),

  update: (id: number, data: Partial<TransactionPayload>) =>
    api.put<Transaction>(`/transactions/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/transactions/${id}`).then((r) => r.data),
}
