import api from './axios'
import type { Paginated, Transaction, TransactionFilters } from '@/types'
import { newClientId, queueEntry } from '@/lib/offline/outbox'
import { isOfflineError } from '@/utils/api'

/** Saved now, or kept on the device until there's a connection */
export type DailySaveResult = { queued: false; transaction: Transaction } | { queued: true }

export interface TransactionPayload {
  category_id: number
  type: string
  scope?: 'personal' | 'business'
  /** PHP balance account code to add to / deduct from; null to unlink */
  balance_account?: string | null
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

  /**
   * Add a daily entry; without a connection it's kept on the device and sent later (see
   * lib/offline/outbox). The id sent with it means a resend after a lost answer saves it only once.
   */
  createOrQueue: async (data: TransactionPayload): Promise<DailySaveResult> => {
    const clientId = newClientId()
    try {
      const { data: transaction } = await api.post<Transaction>('/transactions', { ...data, client_id: clientId })
      return { queued: false, transaction }
    } catch (err) {
      if (!isOfflineError(err)) throw err
      await queueEntry(data, clientId)
      return { queued: true }
    }
  },

  update: (id: number, data: Partial<TransactionPayload>) =>
    api.put<Transaction>(`/transactions/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/transactions/${id}`).then((r) => r.data),
}
