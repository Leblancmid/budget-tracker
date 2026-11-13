export type TransactionType = 'income' | 'expense'

/** personal = counts in Daily Expenses; business = tracked, but left out of Daily Expenses totals */
export type TransactionScope = 'personal' | 'business'

export interface CategoryHighest {
  amount: number
  description: string | null
  /** Y-m-d */
  date: string
}

export interface Category {
  id: number
  name: string
  type: TransactionType
  color: string
  icon: string
  transactions_count?: number
  /** Personal total for the requested month (defaults to the current month) */
  month_total?: number
  /** Personal all-time total */
  all_time_total?: number
  /** Largest single Personal transaction in the requested month, if any */
  month_highest?: CategoryHighest | null
  /** Largest single Personal transaction ever, if any */
  all_time_highest?: number | null
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
  /** Posted automatically by this recurring entry */
  recurring_entry_id?: number | null
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

// ── Master ───────────────────────────────────────────────────────────────────

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
  /** Current balance (adds − sells) in the account's currency */
  balance?: number
  /** Optional interest: % a year, credited daily after interest_tax % is withheld */
  interest_rate?: number | null
  interest_tax?: number
  /** Last day interest was credited for */
  interest_credited_through?: string | null
  /** Last bank check: the day, and the real balance it was matched to */
  checked_at?: string | null
  checked_balance?: number | null
  created_at: string
  updated_at: string
}
export type BalanceEntryType = 'add' | 'sell'

export interface BalanceEntry {
  id: number
  /** Set when the entry was created by a daily transaction (edit it there) */
  transaction_id?: number | null
  /** Set when it's one side (or the fee) of a transfer; removing it undoes the whole transfer */
  balance_transfer_id?: number | null
  /** 'interest' for daily interest credits; 'adjustment' for a bank check difference */
  kind?: 'interest' | 'adjustment' | null
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
  /** ₱ cost of listed accounts whose cost isn't in gold (bought with cash, cash deals) */
  accounts_cash_cost_php?: number
  balance_usd_total: number
  balance_php_total: number
  business_profit?: number
  daily_net?: number
  monthly_business_profit?: number
  monthly_daily_net?: number
  kks_gold?: number
  account_count?: number
  balance_usd_accounts?: number
  balance_php_accounts?: number
  /** own: not an admin, so only their own figures (no wallets, gold or accounts); everyone: the whole business */
  scope?: 'own' | 'everyone'
  // Own overview only
  daily_income?: number
  daily_expense?: number
  monthly_daily_income?: number
  monthly_daily_expense?: number
  /** Sales they made (marked sold, or added already sold) */
  sales_count?: number
  monthly_sales_count?: number
}

/** One Manila month on Master → Overview: what was earned, and what was held at its end (raw ₱, $ and gold). */
export interface MasterTrendMonth {
  /** "2026-11" */
  month: string
  business_profit: number
  daily_income: number
  daily_expense: number
  php_balance: number
  usd_balance: number
  gold_stash: number
  account_gold: number
  account_cash_php: number
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
  /** Gold this trade has put into the Golds inventory; null = not tracked (older trades) */
  inventory_gold?: string | null
  /** Balance wallet payments for the gold bought on this trade (amount in the wallet's currency) */
  wallet_entries?: { id: number; account: string; amount: string; date: string }[]
  php_rate: string | null
  cost_php_rate?: string | null
  price_php: string | null
  cost_php: string | null
  profit_php: string | null
  amount: string
  description: string | null
  date: string
  notes: string | null
  /** Who bought it (optional, private) */
  sold_to?: string | null
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
  /** Items sold in the selected month, newest first */
  recent_sold?: BusinessTransaction[]
  sold_count?: number
  prev_profit?: number
  prev_count?: number
  expense_by_type: Array<{ type: string; total: string }>
  profit_by_type: Array<{ type: string; total: string | number; count?: number; income?: number }>
  /** Sold results per month of the selected year */
  realized_trend?: Array<{ month: number; income: number; expense: number; profit: number; count: number }>
  /** Unsold accounts + gold trades */
  pipeline?: { count: number; awaiting_pricing: number; income: number; cost: number; profit: number; by_type: Array<{ type: string; count: number }> }
  /** Business-tagged daily transactions this month (Transactions page) */
  daily_business?: { income: number; expense: number; count: number }
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

export type AccountPaymentMethod = 'gold_trade' | 'cash'

/** One payment toward an account's cost: gold from a gold trade, or cash from a Balance wallet. */
export interface AccountPayment {
  id: number
  account_id: number
  method: AccountPaymentMethod
  /** Gold of the account's cost this payment covers */
  gold: number
  /** Exact ₱ cost of this payment */
  cost_php: number
  cost_rate: number | null
  cost_php_rate: number | null
  /** Gold trade it came from (null once that trade was used up) */
  source_trade_id: number | null
  /** What was taken from the trade, including the trade's description */
  taken: { trade?: { description?: string | null } } | null
  balance_account: string | null
  cash_amount: number | null
  currency: string | null
  date: string
  note: string | null
}

export interface RucoyAccount {
  id: number
  /** Sold accounts: who bought it (from its sale) */
  sold_to?: string | null
  description: string | null
  email: string
  avatar: string | null
  price: number | null
  cost: number | null
  profit: number | null
  payment_status: AccountPaymentStatus
  payment_date: string | null
  /** In-game Stats screen, shown on listings */
  level: number | null
  melee: number | null
  distance: number | null
  magic: number | null
  defense: number | null
  /** Priced in gold (price/cost in G) or cash (price_cash/cost_cash in cash_currency) */
  deal_type: 'gold' | 'cash'
  price_cash: number | null
  cost_cash: number | null
  cash_currency: 'PHP' | 'USD' | null
  /** Accessory keys (see utils/accessories.ts) */
  accessories: string[] | null
  /** Payments toward the cost, oldest first */
  payments?: AccountPayment[]
  /** Gold paid toward the cost so far (sum of payments) */
  paid_gold?: number
  /** Exact ₱ of the paid part (each payment at its own rates) */
  paid_cost_php?: number
  /** Stats-screen screenshot used for the listing image */
  screenshot: string | null
  /** Print the price on the listing image */
  show_price: boolean
  /** When it went up for sale (days-to-sell runs from here to archived_at) */
  listed_at: string | null
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
  /** What Undo reverses beyond the stash: a gold trade sale goes back onto its trade */
  undo?: { kind: 'trade_sale'; sold_id: number; remaining_id: number | null; gold: number } | null
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

// ── Reports ──────────────────────────────────────────────────────────────────

export type ReportPeriod = 'weekly' | 'monthly' | 'yearly'

export type ReportKind = 'daily-expenses' | 'business'

export interface ReportRow {
  label:   string
  income:  number
  expense: number
  net?:    number
  profit?: number
}

export interface ReportTotals {
  income:  number
  expense: number
  net?:    number
  profit?: number
}

export interface ReportCategory {
  id: number
  name: string
  color: string
  icon: string
  type: 'income' | 'expense'
  total: number
  count: number
}

export interface ReportData {
  period: ReportPeriod
  year:   number
  month:  number
  rows:   ReportRow[]
  totals: ReportTotals
  /** Daily Expenses only: per-category totals for the same range */
  categories?: ReportCategory[]
  /** Business only: totals per sale type (account / gold / expense) for the same range */
  types?: Array<{ type: string; count: number; income: number; expense: number; profit: number }>
}

// ── Automation: recurring entries, weekly brief, price guide ──

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly'

export interface RecurringEntry {
  id: number
  category_id: number
  category: Category
  type: TransactionType
  scope: TransactionScope
  amount: string
  description: string | null
  /** PHP Balance account it's paid from / into */
  balance_account: string | null
  frequency: RecurringFrequency
  /** Monthly: the day it repeats on (short months use their last day) */
  day_of_month: number | null
  next_date: string
  active: boolean
  last_posted_on: string | null
}

export type BriefLevel = 'bad' | 'warn' | 'good' | 'info'

export interface BriefInsight {
  key: string
  level: BriefLevel
  title: string
  detail: string
  /** App path to act on it */
  link: string | null
}

/** The Daily Expenses weekly brief (GET /dashboard/brief): the signed-in user's own spending */
export interface DailyBrief {
  from: string
  to: string
  /** Monday of the current week (Y-m-d) */
  week: string
  summary: {
    spent: number
    prev_spent: number
    income: number
    month_spent: number
    /** Total of this month's budgets, null when none are set */
    month_budget: number | null
    /** What's left of the budgets per day until month end, null when none are set */
    safe_per_day: number | null
    days_left: number
  }
  insights: BriefInsight[]
}

export interface BusinessBrief {
  from: string
  to: string
  /** Monday of the current week (Y-m-d) */
  week: string
  summary: {
    profit: number
    prev_profit: number
    accounts_sold: number
    gold_sold: number
    gold_margin: number | null
    usual_gold_margin: number | null
  }
  insights: BriefInsight[]
}

export type AccountClass = 'melee' | 'distance' | 'magic'

export interface PriceComparable {
  id: number
  description: string | null
  level: number | null
  /** Stats screen; null when it wasn't filled in */
  melee: number | null
  distance: number | null
  magic: number | null
  defense: number | null
  class: AccountClass | null
  price_php: number | null
  cost_php: number | null
  price_gold: number | null
  cost_gold: number | null
  days_to_sell: number | null
  sold_on: string | null
}

export interface PriceGuide {
  account: {
    level: number | null
    class: AccountClass | null
    sold_count: number
    /** % profit of price over all sold accounts */
    usual_margin: number | null
    comparables: PriceComparable[]
    /** ± levels the comparables are within */
    level_range: number | null
    price_php: number | null
    price_gold: number | null
    days_to_sell: number | null
    max_buy_php: number | null
    max_buy_gold: number | null
  }
  gold: {
    sales: number
    sell_rate: number | null
    recent_sell_rate: number | null
    buy_rate: number | null
    usual_margin: number | null
    usual_spread: number | null
    max_buy_rate: number | null
  }
}
