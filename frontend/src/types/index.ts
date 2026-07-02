export type TransactionType = 'income' | 'expense'

export interface Category {
  id: number
  name: string
  type: TransactionType
  color: string
  icon: string
  transactions_count?: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: number
  category_id: number
  category: Category
  type: TransactionType
  amount: string
  description: string | null
  date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Budget {
  id: number
  category_id: number
  category: Category
  amount: string
  month: number
  year: number
  spent?: number
  remaining?: number
  percentage?: number
  created_at: string
  updated_at: string
}

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface Paginated<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

export interface DashboardStats {
  total_income: number
  total_expense: number
  balance: number
  recent_transactions: Transaction[]
  expense_by_category: Array<{
    category_id: number
    total: string
    category: Pick<Category, 'id' | 'name' | 'color' | 'icon'>
  }>
  monthly_trend: Array<{
    month: number
    year: number
    type: TransactionType
    total: string
  }>
}

export interface TransactionFilters {
  type?: TransactionType | ''
  category_id?: number | ''
  date_from?: string
  date_to?: string
  search?: string
  per_page?: number
  page?: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

// ── Rucoy ────────────────────────────────────────────────────────────────────

export type TradeStatus = 'kks' | 'cash'
export type TradeCurrency = 'USD' | 'EUR' | 'PHP'
export type TradePaymentMethod = 'binance' | 'paypal'

export interface Gold {
  id: number
  amount: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Trade {
  id: number
  gold_id?: number | null
  description: string | null
  status: TradeStatus
  amount: string
  currency: TradeCurrency | null
  payment_method: TradePaymentMethod | null
  completion_date: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface RucoyAccount {
  id: number
  description: string | null
  email: string
  avatar: string | null
  price: number | null
  cost: number | null
  profit: number | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type GoldLogType = 'add' | 'sell'

export interface GoldLog {
  id: number
  type: GoldLogType
  amount: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface RucoyDashboardStats {
  total_gold: number
  manual_gold: number
  kks_gold: number
  trade_count: number
  account_count: number
}
