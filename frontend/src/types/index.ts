export type TransactionType = 'income' | 'expense'

/** personal = counts in Daily Expenses; business = tracked, but left out of Daily Expenses totals */
export type TransactionScope = 'personal' | 'business'

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
  scope: TransactionScope
  amount: string
  description: string | null
  date: string
  notes: string | null
  /** Balance entry this transaction adds to / deducts from */
  balance_entry?: { id: number; transaction_id: number; account: string } | null
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
  /** Business-tagged daily transactions this month (not in the totals above) */
  business_income?: number
  business_expense?: number
  business_count?: number
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
  scope?: TransactionScope | ''
  /** account code, or 'none' for unlinked transactions */
  balance_account?: string
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

// ── Master ───────────────────────────────────────────────────────────────────

export type SavingModeOfPayment = 'CIMB' | 'MARIBANK' | 'GCASH'
export type SavingType = 'deposit' | 'withdraw'

export interface Saving {
  id: number
  mode_of_payment: SavingModeOfPayment
  type: SavingType
  description: string | null
  amount: string
  date: string
  created_at: string
  updated_at: string
}

/** Code of a user-managed balance account (see BalanceAccountConfig) */
export type BalanceAccount = string

export type BalanceCurrency = 'USD' | 'PHP'

export interface BalanceAccountConfig {
  id: number
  code: string
  name: string
  currency: BalanceCurrency
  color: string
  icon: string
  sort_order: number
  hidden_at: string | null
  entry_count: number
  created_at: string
  updated_at: string
}
export type BalanceEntryType = 'add' | 'sell'

export interface BalanceEntry {
  id: number
  /** Set when the entry was created by a daily transaction (edit it there) */
  transaction_id?: number | null
  account: BalanceAccount
  type: BalanceEntryType
  amount: string
  description: string | null
  date: string
  created_at: string
  updated_at: string
}

export interface MasterDashboardStats {
  overall_profit:    number
  monthly_profit:    number
  gold_stash:        number
  total_price:       number
  balance_usd_total: number
  balance_php_total: number
}

// ── Business ─────────────────────────────────────────────────────────────────

export type BusinessTransactionType = 'account' | 'gold' | 'expense'
export type BusinessTransactionAction = 'buy' | 'sell'

export interface BusinessTransaction {
  id: number
  type: BusinessTransactionType
  /** Set on app-managed rows that can't be deleted, e.g. 'middleman_fee' */
  system_key?: string | null
  action: BusinessTransactionAction | null
  account_id: number | null
  price_rate: string | null
  cost_rate: string | null
  price_gold: string | null
  cost_gold: string | null
  price_gold_received?: string | null
  cost_gold_paid?: string | null
  php_rate: string | null
  cost_php_rate?: string | null
  price_php: string | null
  cost_php: string | null
  profit_php: string | null
  amount: string
  description: string | null
  date: string
  notes: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface BusinessDashboardStats {
  total_income: number
  total_expense: number
  total_profit: number
  archived_income: number
  archived_expense: number
  initial_profit: number
  recent_transactions: BusinessTransaction[]
  expense_by_type: Array<{ type: string; total: string }>
  profit_by_type: Array<{ type: string; total: string }>
  monthly_trend: Array<{
    month: number
    year: number
    type: 'income' | 'expense'
    total: string
  }>
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
  middleman_fee: number | null
  completion_date: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type AccountPaymentStatus = 'not_paid' | 'partially_paid' | 'fully_paid'

export interface RucoyAccount {
  id: number
  description: string | null
  email: string
  avatar: string | null
  price: number | null
  cost: number | null
  profit: number | null
  payment_status: AccountPaymentStatus
  payment_date: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface MiddlemanFee {
  id: number
  amount: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface MiddlemanFeeIndex {
  fees:  MiddlemanFee[]
  total: number
}

export type GoldLogType = 'add' | 'sell' | 'fee'

export interface GoldLog {
  id: number
  type: GoldLogType
  amount: string
  description: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface RucoyDashboardStats {
  total_gold: number
  manual_gold: number
  kks_gold: number
  trade_count: number
  account_count: number
  account_total_cost:  number
  account_total_price: number
  accounts_to_pay: number
}
