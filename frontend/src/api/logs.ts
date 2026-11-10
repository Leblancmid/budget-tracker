import api from './axios'

export interface LogEntry {
  /** access: sign-ins and sign-outs; system: undo / redo */
  module: 'daily' | 'business' | 'savings' | 'balance' | 'gold' | 'trade' | 'access' | 'system'
  type: string
  description: string | null
  amount: string | null
  /** Field-by-field diff for "edited" entries */
  changes?: Record<string, { before: unknown; after: unknown }> | null
  date: string | null
  created_at: string
  ip_address: string | null
  user_agent: string | null
  user_id: number | null
  user_name: string | null
  user_email: string | null
  /** Whose account it's about when nobody did it (a failed sign-in with their email) */
  about_user_id?: number | null
  /** Balance entries: the account's currency and name */
  currency?: 'USD' | 'PHP'
  account_name?: string
}

export const logsApi = {
  getAll: () => api.get<{ data: LogEntry[] }>('/logs').then((r) => r.data),
}
