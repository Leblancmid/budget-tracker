import api from './axios'

export interface LogEntry {
  /** access: sign-ins, sign-outs and changes to user accounts; system: undo / redo */
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

/** How far back the Logs page looks, in days (0 = everything) */
export type LogPeriod = 30 | 90 | 365 | 0

export const LOG_PERIODS: { days: LogPeriod; label: string }[] = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: 'Year' },
  { days: 0, label: 'All' },
]

export const logsApi = {
  getAll: (days: LogPeriod = 90) => api.get<{ data: LogEntry[]; days: LogPeriod }>('/logs', { params: { days } }).then((r) => r.data),
}
