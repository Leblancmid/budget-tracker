import api from './axios'
import type { AccountClass, BusinessBrief, BusinessTransaction, BusinessDashboardStats, BusinessTransactionType, BusinessTransactionAction, PaginationMeta, PriceGuide } from '@/types'

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
  /** The Discord listings channel is set up (LISTING_DISCORD_WEBHOOK) */
  discord?: boolean
  discord_auto?: DiscordAutoPost
}

/** One run (10 AM or 10 PM) of one day on the Discord page */
export interface DiscordSlot {
  /** Its time has come (no results then: auto-post was off, or the server PC was) */
  due: boolean
  /** Why the whole run didn't post, if it didn't */
  skipped: string | null
  /** By channel key */
  results: Record<string, { ok: boolean; note: string | null; at: string }>
}

/** When a server gets auto-posts: both runs, the 10 AM or 10 PM one, or never (Send only) */
export type DiscordSchedule = 'both' | 'am' | 'pm' | 'manual'

export interface DiscordChannel {
  no: number
  key: string
  label: string | null
  name: string | null
  open_url?: string | null
  alive: boolean | null
  last_sent_at: string | null
  schedule: DiscordSchedule
  /** A new post deletes your previous one there */
  replace: boolean
  /** Who its posts bring to the website (?from=); null when website stats aren't connected */
  reach: { visitors_7: number; visitors_30: number; requests_30: number } | null
}

export interface DiscordPostsPage {
  auto: DiscordAutoPost
  /**
   * label: your name for it (e.g. "Asian Market") · name: the webhook's name in Discord (what posts
   * show) · open_url: opens its channel in Discord · alive: false when Discord says it was deleted
   */
  channels: DiscordChannel[]
  /** Newest first */
  days: { date: string; am: DiscordSlot; pm: DiscordSlot }[]
  /** Posts you made ("Post image to Discord", publish, Send to one server: channel_key) */
  own: { kind: 'manual' | 'publish' | 'single'; at: string; sent: number; total: number; channel_key: string | null }[]
}

export const discordPostsApi = {
  get: (fresh = false) => api.get<DiscordPostsPage>('/business/discord-posts', { params: fresh ? { fresh: 1 } : {} }).then((r) => r.data),
  /** Send the saved picture to every server now */
  sendAll: () => api.post<{ message: string; sent: number; total: number }>('/business/discord-posts/send-all').then((r) => r.data),
  /** Send the saved picture to one server now */
  send: (channelKey: string) => api.post<{ message: string }>(`/business/discord-posts/${channelKey}/send`).then((r) => r.data),
  /** A server's settings: your name for it (only in this app; empty: the default), schedule, replace. Only what's sent changes. */
  update: (channelKey: string, changes: { name?: string; schedule?: DiscordSchedule; replace?: boolean }) =>
    api.put<{ label: string | null; schedule: DiscordSchedule; replace: boolean }>(`/business/discord-posts/${channelKey}`, changes).then((r) => r.data),
  /** The saved picture (what auto-post and Send post) */
  image: () => api.get<Blob>('/business/discord-posts/image', { responseType: 'blob' }).then((r) => r.data),
}

/** Discord auto-post: the saved Listing Kit image at 10 AM and 10 PM */
export interface DiscordAutoPost {
  enabled: boolean
  /** When the saved picture was made / last posted (ISO), and the next post while on */
  image_at: string | null
  posted_at: string | null
  next_at: string | null
  /** What's for sale changed since the picture: it won't post until you post or publish again */
  stale: boolean
}

/** The Listing Kit image and its caption, for the Discord listings channel */
export interface KitImage { blob: Blob; caption: string }

const kitForm = (kit: KitImage | null) => {
  const form = new FormData()
  if (kit) {
    form.append('image', kit.blob, kit.blob.type === 'image/jpeg' ? 'Leblanc.jpg' : 'Leblanc.png')
    form.append('caption', kit.caption)
  }
  return form
}

/** Accounts for sale → the Leblanc website (commit + push; Vercel redeploys) */
export const listingPublishApi = {
  preview: () => api.get<ListingPublishPreview>('/business/listing/publish').then((r) => r.data),
  /** kit: the Listing Kit image, posted to Discord when what's for sale changed */
  publish: (kit: KitImage | null = null) => api.post<{
    count: number; changed: boolean; pushed: boolean; commit: string | null; alerted: number | null
    /** on: set up · changed: what's for sale changed · image: one was sent · posted: it went through */
    discord?: { on: boolean; changed: boolean; image: boolean; posted: boolean; sent: number; total: number }
  }>('/business/listing/publish', kitForm(kit), { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  /** Post the Listing Kit image to Discord now */
  postToDiscord: (kit: KitImage) =>
    api.post<{ message: string; sent: number; total: number }>('/business/listing/discord', kitForm(kit), { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  /** Auto-post on (with the image it will post) or off */
  discordAuto: (enabled: boolean, kit: KitImage | null) => {
    const form = kitForm(kit)
    form.append('enabled', enabled ? '1' : '0')
    return api.post<DiscordAutoPost>('/business/listing/discord-auto', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
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
  /** Website leads still waiting for a reply (oldest = ms timestamp) */
  leads_new?: { count: number; oldest: number | null }
}

/** Visitors of the Leblanc website (online now, visits, views per listing, "Notify me" requests) */
export const websiteStatsApi = {
  // "Not configured" answers with just { configured: false }: fill in empty numbers
  /** fresh: skip the server's 30-second cache (e.g. right after replying to a lead) */
  get: (fresh = false): Promise<WebsiteStats> => api.get<Partial<WebsiteStats> & { configured: boolean }>('/business/website-stats', { params: fresh ? { fresh: 1 } : {} }).then((r) => ({
    online: 0, online_pages: [], today: { visitors: 0, pageviews: 0 }, last7: { visitors: 0, pageviews: 0 },
    last30: { visitors: 0, pageviews: 0 }, all_time: { unique_visitors: 0, pageviews: 0 }, daily: [], listing_views: [], alerts: [],
    ...r.data,
  })),
  /** Remove a buyer's "Notify me" request */
  deleteAlert: (id: number) => api.delete<{ message: string }>(`/business/website-alerts/${id}`).then((r) => r.data),
}

export type LeadStatus = 'new' | 'contacted' | 'won' | 'lost'

export interface Lead {
  id: number
  /** sell_gold: someone wants to sell you gold */
  type: 'account' | 'gold' | 'sell' | 'sell_gold' | 'project'
  status: LeadStatus
  name: string
  method: 'discord' | 'whatsapp'
  contact: string
  listing_id: string | null
  details: {
    title?: string
    message?: string | null
    amount_kk?: number; payment?: string; currency?: string; per_kk?: number; total?: number
    level?: number; category?: string; asking?: string | null
    /** sell_gold: the rate they ask, as typed ("$0.17", "₱10/KK") */
    rate?: string | null
    /** project: a website someone wants built */
    kind?: 'store' | 'system' | 'fix'; budget?: string | null; timeline?: string | null
    stats?: Partial<Record<'melee' | 'distance' | 'magic' | 'defense', number>>
  }
  created_at: number
  updated_at: number
  /** The listed account, if it's an "I want this" */
  account_name: string | null
  account_sold: boolean | null
  /** Price guide for an account offered to you */
  guide: { price_php: number | null; max_buy_php: number | null; max_buy_gold: number | null; sales: number } | null
  /** The Discord server the buyer came through (your name for it), or null */
  source?: string | null
}

/** Leads from the website (kept on the website's database) */
export const leadsApi = {
  getAll: () => api.get<{ configured: boolean; leads: Lead[] }>('/business/leads').then((r) => r.data),
  setStatus: (id: number, status: LeadStatus) => api.patch<{ message: string }>(`/business/leads/${id}`, { status }).then((r) => r.data),
}

export interface WebsiteGoldRate { method: string; currency: 'USD' | 'PHP'; per_kk: number }
export interface WebsiteGold {
  gold: { rates: WebsiteGoldRate[]; min_order_kk: number | null; note: string | null }
  guide: PriceGuide['gold']
}

/** Gold rates shown on the website (published with the listings) */
export const websiteGoldApi = {
  get: () => api.get<WebsiteGold>('/business/website-gold').then((r) => r.data),
  save: (gold: WebsiteGold['gold']) => api.put<WebsiteGold>('/business/website-gold', gold).then((r) => r.data),
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
  /** Mark sold, optionally saying who bought it */
  archive:   (id: number, soldTo?: string | null) =>
    api.post<BusinessTransaction>(`/business/transactions/${id}/archive`, { sold_to: soldTo || null }).then((r) => r.data),
  /** People sold to before, most recent first (suggestions) */
  buyers:    () => api.get<string[]>('/business/transactions/buyers').then((r) => r.data),
  unarchive: (id: number) =>
    api.post<BusinessTransaction>(`/business/transactions/${id}/unarchive`).then((r) => r.data),
  delete:    (id: number) =>
    api.delete<{ message: string }>(`/business/transactions/${id}`).then((r) => r.data),
  /** Sell all or part of a confirmed gold trade (amount in G). */
  sell:      (id: number, amount: number, deductInventory: boolean, description?: string, soldTo?: string | null) =>
    api.post<{ sold: BusinessTransaction; remaining: BusinessTransaction | null }>(
      `/business/transactions/${id}/sell`, { amount, deduct_inventory: deductInventory, description: description || null, sold_to: soldTo || null },
    ).then((r) => r.data),
  /** Add gold onto a gold trade's price/cost; price gold also goes into the Golds inventory. */
  addGold:   (id: number, data: { price_gold: number; cost_gold: number; cost_php?: number; description?: string; balance_account?: string | null }) =>
    api.post<BusinessTransaction>(`/business/transactions/${id}/add-gold`, { ...data, description: data.description || null })
      .then((r) => r.data),
}

/** How each account on the website is doing (see ListingPerformance on the server) */
export type ListingVerdict = 'interest' | 'early' | 'reach' | 'price' | 'slow'
export interface ListingPerformanceRow {
  account_id: number
  name: string
  price: string | null
  days: number
  /** null when the website's stats aren't available */
  views: number | null
  views_week: number | null
  requests: number | null
  verdict: ListingVerdict
  advice: string
}
export interface ListingPerformance { usual_days: number; has_stats: boolean; listings: ListingPerformanceRow[] }

export const listingPerformanceApi = {
  get: () => api.get<ListingPerformance>('/business/listing-performance').then((r) => r.data),
}

/** The people you sell to, from "Sold to" (see Buyers on the server) */
export interface Buyer {
  name: string
  purchases: number
  accounts: number
  golds: number
  total_php: number
  profit_php: number
  first_on: string | null
  last_on: string | null
  items: { id: number; type: 'account' | 'gold'; description: string | null; price_php: number | null; sold_on: string | null }[]
}
export interface BuyersSummary { buyers: number; repeat: number; repeat_share: number | null; repeat_sales_php: number; total_php: number }
export type BuyerSort = 'recent' | 'purchases' | 'total'
export interface BuyersPage extends PaginationMeta { data: Buyer[]; summary: BuyersSummary }

export const buyersApi = {
  list: (params: { q?: string; sort?: BuyerSort; page?: number; per_page?: number }) =>
    api.get<BuyersPage>('/business/buyers', { params }).then((r) => r.data),
}
