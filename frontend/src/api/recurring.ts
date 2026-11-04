import api from './axios'
import type { RecurringEntry, RecurringFrequency, TransactionScope, TransactionType } from '@/types'

export interface RecurringEntryPayload {
  category_id: number
  type: TransactionType
  scope?: TransactionScope
  amount: number
  description?: string | null
  /** PHP Balance account code; null = not linked */
  balance_account?: string | null
  frequency: RecurringFrequency
  /** First / next date it posts on (Y-m-d) */
  next_date: string
  active?: boolean
}

export const recurringEntriesApi = {
  getAll: () => api.get<{ data: RecurringEntry[] }>('/recurring-entries', { params: { per_page: 100 } }).then((r) => r.data.data),
  create: (data: RecurringEntryPayload) => api.post<RecurringEntry>('/recurring-entries', data).then((r) => r.data),
  update: (id: number, data: Partial<RecurringEntryPayload>) => api.put<RecurringEntry>(`/recurring-entries/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete<{ message: string }>(`/recurring-entries/${id}`).then((r) => r.data),
}
