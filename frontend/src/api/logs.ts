import api from './axios'

export interface LogEntry {
  module: 'daily' | 'business' | 'savings' | 'balance' | 'gold'
  type: string
  description: string | null
  amount: string | null
  date: string | null
  created_at: string
}

export const logsApi = {
  getAll: () => api.get<{ data: LogEntry[] }>('/logs').then((r) => r.data),
}
