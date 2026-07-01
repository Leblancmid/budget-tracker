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
  getAll: async (filters: TransactionFilters = {}): Promise<Paginated<Transaction>> => {
    const { data } = await api.get('/transactions', { params: filters })
    // Laravel's paginate() returns pagination fields at the top level, not nested under "meta".
    // Normalise here so the rest of the app can rely on the Paginated<T> shape.
    return {
      data: data.data,
      links: data.links ?? { first: null, last: null, prev: null, next: null },
      meta: data.meta ?? {
        current_page: data.current_page,
        from: data.from,
        last_page: data.last_page,
        per_page: data.per_page,
        to: data.to,
        total: data.total,
      },
    }
  },

  create: (data: TransactionPayload) =>
    api.post<Transaction>('/transactions', data).then((r) => r.data),

  update: (id: number, data: Partial<TransactionPayload>) =>
    api.put<Transaction>(`/transactions/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/transactions/${id}`).then((r) => r.data),
}
