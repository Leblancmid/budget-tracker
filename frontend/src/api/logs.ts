import api from './axios'

export interface LogEntry {
  module: 'daily' | 'business' | 'savings' | 'balance' | 'gold' | 'trade'
  type: string
  description: string | null
  amount: string | null
  date: string | null
  created_at: string
  ip_address: string | null
  user_agent: string | null
}

export const logsApi = {
  getAll: () => api.get<{ data: LogEntry[] }>('/logs').then((r) => r.data),
}
