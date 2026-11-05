import api from './axios'
import type { AccountClass, BusinessBrief, BusinessTransaction, BusinessDashboardStats, BusinessTransactionType, BusinessTransactionAction, PriceGuide } from '@/types'

export interface PublishedListing {
  id: string
  category: 'Melee' | 'Distance' | 'Magic'
  level: number
  stats?: { melee: number; distance: number; magic: number; defense: number }
  image: string
  price?: string
  featured?: boolean
}

export interface ListingPublishPreview {
  /** LISTING_SITE_PATH points at the website repo */
  configured: boolean
  listings: PublishedListing[]
  skipped: { id: number; name: string; reason: string }[]
}

/** Accounts for sale → the Leblanc website (commit + push; Vercel redeploys) */
export const listingPublishApi = {
  preview: () => api.get<ListingPublishPreview>('/business/listing/publish').then((r) => r.data),
  publish: () => api.post<{ count: number; changed: boolean; pushed: boolean; commit: string | null; alerted: number | null }>('/business/listing/publish').then((r) => r.data),
}

export interface WebsiteStats {
  /** LISTING_SITE_TOKEN is set */
  configured: boolean
  online: number
  online_pages: { path: string | null; n: number }[]
  today: { visitors: number; pageviews: number }
  last7: { visitors: number; pageviews: number }
  last30: { visitors: number; pageviews: number }
  all_time: { unique_visitors: number; pageviews: number }
  daily: { day: string; visitors: number; pageviews: number }[]
  listing_views: { listing_id: string; account_id: number | null; name: string; sold: boolean | null; total: number; last7: number }[]
  alerts: { id: number; name: string; method: 'discord' | 'whatsapp'; contact: string; category: string | null; min_level: number; max_level: number | null; created_at: number; expires_at: number }[]
}

/** Visitors of the Leblanc website (online now, visits, views per listing, "Notify me" requests) */
export const websiteStatsApi = {
  // "Not configured" answers with just { configured: false }: fill in empty numbers
  get: (): Promise<WebsiteStats> => api.get<Partial<WebsiteStats> & { configured: boolean }>('/business/website-stats').then((r) => ({
    online: 0, online_pages: [], today: { visitors: 0, pageviews: 0 }, last7: { visitors: 0, pageviews: 0 },
    last30: { visitors: 0, pageviews: 0 }, all_time: { unique_visitors: 0, pageviews: 0 }, daily: [], listing_views: [], alerts: [],
    ...r.data,
  })),
  /** Remove a buyer's "Notify me" request */
  deleteAlert: (id: number) => api.delete<{ message: string }>(`/business/website-alerts/${id}`).then((r) => r.data),
}

/** Rule-based insights from your own numbers */
export const businessInsightsApi = {
  brief:      () => api.get<BusinessBrief>('/business/brief').then((r) => r.data),
  priceGuide: (params: { level?: number | null; class?: AccountClass | null; exclude_id?: number | null }) =>
    api.get<PriceGuide>('/business/price-guide', { params }).then((r) => r.data),
}

export const businessDashboardApi = {
  getStats: (month: number, year: number) =>
    api.get<BusinessDashboardStats>('/business/dashboard', { params: { month, year } }).then((r) => r.data),
}

export interface BusinessTransactionPayload {
  type: BusinessTransactionType
  action?: BusinessTransactionAction | null
  account_id?: number | null
  price_rate?: number | null
  cost_rate?: number | null
  price_gold?: number | null
  cost_gold?: number | null
  price_gold_received?: number | null
  cost_gold_paid?: number | null
  php_rate?: number | null
  cost_php_rate?: number | null
  amount: number
  description?: string | null
  date: string
  notes?: string | null
  price_php?: number | null
  cost_php?: number | null
  /** New gold trades only: also put the Price (G) into the Golds inventory */
  add_to_inventory?: boolean
  /** New gold trades only: Balance wallet the bought gold was paid from (its cost is deducted there) */
  balance_account?: string | null
}

export interface BusinessSummary { income: number; expense: number; profit: number; month: number; year: number }

export const businessTransactionsApi = {
  getAll:      () => api.get<BusinessTransaction[]>('/business/transactions').then((r) => r.data),
  getArchived: () => api.get<BusinessTransaction[]>('/business/transactions/archived').then((r) => r.data),
  getSummary:  (month: number, year: number) =>
    api.get<BusinessSummary>('/business/transactions/summary', { params: { month, year } }).then((r) => r.data),
  create:    (data: BusinessTransactionPayload) =>
    api.post<BusinessTransaction>('/business/transactions', data).then((r) => r.data),
  update:    (id: number, data: BusinessTransactionPayload) =>
    api.put<BusinessTransaction>(`/business/transactions/${id}`, data).then((r) => r.data),
  archive:   (id: number) =>
    api.post<BusinessTransaction>(`/business/transactions/${id}/archive`).then((r) => r.data),
  unarchive: (id: number) =>
    api.post<BusinessTransaction>(`/business/transactions/${id}/unarchive`).then((r) => r.data),
  delete:    (id: number) =>
    api.delete<{ message: string }>(`/business/transactions/${id}`).then((r) => r.data),
  /** Sell all or part of a confirmed gold trade (amount in G). */
  sell:      (id: number, amount: number, deductInventory: boolean, description?: string) =>
    api.post<{ sold: BusinessTransaction; remaining: BusinessTransaction | null }>(
      `/business/transactions/${id}/sell`, { amount, deduct_inventory: deductInventory, description: description || null },
    ).then((r) => r.data),
  /** Add gold onto a gold trade's price/cost; price gold also goes into the Golds inventory. */
  addGold:   (id: number, data: { price_gold: number; cost_gold: number; cost_php?: number; description?: string; balance_account?: string | null }) =>
    api.post<BusinessTransaction>(`/business/transactions/${id}/add-gold`, { ...data, description: data.description || null })
      .then((r) => r.data),
}

