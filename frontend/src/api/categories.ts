import api from './axios'
import type { Category } from '@/types'

export const categoriesApi = {
  /** month/year select which month month_total covers (default: current month) */
  getAll: (params?: { month?: number; year?: number }) => api.get<Category[]>('/categories', { params }).then((r) => r.data),

  create: (data: Pick<Category, 'name' | 'type' | 'color' | 'icon'>) =>
    api.post<Category>('/categories', data).then((r) => r.data),

  update: (id: number, data: Partial<Pick<Category, 'name' | 'type' | 'color' | 'icon'>>) =>
    api.put<Category>(`/categories/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/categories/${id}`).then((r) => r.data),
}
