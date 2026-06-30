import api from './axios'
import type { Category } from '@/types'

export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories').then((r) => r.data),

  create: (data: Pick<Category, 'name' | 'type' | 'color' | 'icon'>) =>
    api.post<Category>('/categories', data).then((r) => r.data),

  update: (id: number, data: Partial<Pick<Category, 'name' | 'type' | 'color' | 'icon'>>) =>
    api.put<Category>(`/categories/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/categories/${id}`).then((r) => r.data),
}
