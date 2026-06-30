import api from './axios'
import type { Budget } from '@/types'

export const budgetsApi = {
  getAll: (month: number, year: number) =>
    api.get<Budget[]>('/budgets', { params: { month, year } }).then((r) => r.data),

  create: (data: { category_id: number; amount: number; month: number; year: number }) =>
    api.post<Budget>('/budgets', data).then((r) => r.data),

  update: (id: number, data: { amount: number }) =>
    api.put<Budget>(`/budgets/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/budgets/${id}`).then((r) => r.data),
}
