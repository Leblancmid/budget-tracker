import api from './axios'
import type { MasterDashboardStats, Saving } from '@/types'

export const masterDashboardApi = {
  getStats: () => api.get<MasterDashboardStats>('/master/dashboard').then((r) => r.data),
}

export interface SavingPayload {
  mode_of_payment: 'CIMB' | 'MARIBANK' | 'GCASH'
  type: 'deposit' | 'withdraw'
  transfer?: 'daily_expenses' | 'business' | null
  description?: string | null
  amount: number
  date: string
}

export const savingsApi = {
  getAll:  ()                          => api.get<Saving[]>('/master/savings').then((r) => r.data),
  create:  (data: SavingPayload)       => api.post<Saving>('/master/savings', data).then((r) => r.data),
  update:  (id: number, data: SavingPayload) => api.put<Saving>(`/master/savings/${id}`, data).then((r) => r.data),
  delete:  (id: number)                => api.delete<{ message: string }>(`/master/savings/${id}`).then((r) => r.data),
}
