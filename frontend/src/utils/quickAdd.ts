/**
 * Quick Add: turn one line, written the way you'd type it in chat, into an entry.
 *
 *   250 lunch gcash             → expense ₱250 "Lunch", paid from GCash
 *   +15k salary maya            → income ₱15,000 "Salary" into Maya
 *   5000 maribank > gcash fee 15 → transfer
 *   gold 500kk @.17 sell .19 gcash → gold trade bought at $0.17/KK, selling at $0.19/KK
 *   gold 500kk @.17 ₱5400 gcash → gold paid ₱5,400 (₱ paid)
 *
 * Plain rules, no AI: it's instant, free and does the same thing every time.
 */

export interface QuickAddWallet { code: string; name: string; currency: 'PHP' | 'USD' }
export interface QuickAddCategory { id: number; name: string; type: 'income' | 'expense' }
/** A past transaction, to learn which category a description usually goes in */
export interface QuickAddHistory { description: string | null; category_id: number; type: 'income' | 'expense' }

export interface QuickAddContext {
  wallets: QuickAddWallet[]
  categories: QuickAddCategory[]
  history: QuickAddHistory[]
  /** Business, gold and transfers need the full app (not daily-only users) */
  isAdmin: boolean
  today: string
}

export type QuickAddResult =
  | { kind: 'daily'; type: 'income' | 'expense'; amount: number; description: string; categoryId: number | null; wallet: string | null; business: boolean; date: string }
  | { kind: 'transfer'; amount: number; from: string; to: string; fee: number | null; date: string; note: string | null }
  | { kind: 'gold'; gold: number; costRate: number | null; sellRate: number | null; phpPaid: number | null; wallet: string | null; description: string; date: string }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const INCOME_WORDS = new Set(['income', 'salary', 'sahod', 'received', 'receive', 'refund', 'allowance', 'bonus', 'earned', 'payout'])
const TRANSFER_WORDS = new Set(['transfer', 'xfer', 'send', 'sent', 'move', 'moved'])
const GOLD_WORDS = new Set(['gold', 'buy', 'bought', 'g'])
const BUSINESS_WORDS = new Set(['biz', 'business'])
const ARROWS = new Set(['>', '->', '→', 'to'])

/** "500m", "500kk", "1.8b", "1.8kkk", "500,000,000g" → gold; null if it isn't a gold amount. */
export function parseGold(token: string): number | null {
  const m = token.toLowerCase().replace(/,/g, '').match(/^(\d+(?:\.\d+)?)(kkk|kk|b|m|g)$/)
  if (!m) return null
  const n = parseFloat(m[1])
  const mult = { kkk: 1e9, b: 1e9, kk: 1e6, m: 1e6, g: 1 }[m[2] as 'kkk' | 'b' | 'kk' | 'm' | 'g']
  return Math.round(n * mult)
}

/** "250", "1,500", "5k", "₱250", "p250", "250php" → pesos; null if it isn't money. */
export function parseMoney(token: string): number | null {
  const m = token.toLowerCase().replace(/,/g, '').match(/^(?:₱|p|php)?(\d+(?:\.\d+)?)(k)?(?:php|p)?$/)
  if (!m) return null
  return Math.round(parseFloat(m[1]) * (m[2] ? 1000 : 1) * 100) / 100
}

/** "@.17", "@0.17", ".17", "0.17" → a $ per 1M rate (always below 1). */
function parseRate(token: string): number | null {
  const m = token.match(/^@?(0?\.\d+)$/)
  return m ? parseFloat(m[1]) : null
}

function findWallet(token: string, wallets: QuickAddWallet[]): QuickAddWallet | null {
  const t = norm(token)
  if (t.length < 2) return null
  const exact = wallets.find((w) => norm(w.name) === t || norm(w.code) === t)
  if (exact) return exact
  if (t.length < 3) return null
  const starts = wallets.filter((w) => norm(w.name).startsWith(t) || norm(w.code).startsWith(t))
  return starts.length === 1 ? starts[0] : null
}

function shiftDate(today: string, days: number): string {
  const [y, m, d] = today.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10) // UTC calendar arithmetic, not a local time
}

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

/** The category for a description: one named in it, else the one you used last time for it. */
function findCategory(words: string[], description: string, type: 'income' | 'expense' | null, ctx: QuickAddContext) {
  const pool = type ? ctx.categories.filter((c) => c.type === type) : ctx.categories
  for (const w of words) {
    const hit = pool.find((c) => norm(c.name) === norm(w))
    if (hit) return { category: hit, usedWord: w }
  }
  const d = norm(description)
  if (d) {
    const past = ctx.history.find((h) => norm(h.description ?? '') === d && (!type || h.type === type))
      ?? ctx.history.find((h) => norm((h.description ?? '').split(/\s+/)[0] ?? '') === norm(words[0] ?? '') && (!type || h.type === type))
    const cat = past ? ctx.categories.find((c) => c.id === past.category_id) : undefined
    if (cat) return { category: cat, usedWord: null }
  }
  return { category: null, usedWord: null }
}

export function parseQuickAdd(input: string, ctx: QuickAddContext): QuickAddResult {
  const raw = input.trim()
  if (!raw) return { kind: 'empty' }

  // "+250 …" is income; split "@.17" glued to words and "x>y" arrows apart
  let tokens = raw.replace(/(\S)(->|→|>)(\S)/g, '$1 $2 $3').split(/\s+/)
  let income = false
  if (tokens[0].startsWith('+')) { income = true; tokens[0] = tokens[0].slice(1); if (!tokens[0]) tokens = tokens.slice(1) }

  let date = ctx.today
  const words: string[] = []
  const wallets: QuickAddWallet[] = []
  const money: number[] = []
  const rates: number[] = []
  let gold: number | null = null
  let goldWord = false
  let transferWord = false
  let business = false
  let fee: number | null = null
  let sellRate: number | null = null
  let phpPaid: number | null = null

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const lower = t.toLowerCase()
    const next = tokens[i + 1]

    if (lower === 'yesterday') { date = shiftDate(ctx.today, -1); continue }
    if (lower === 'today') continue
    if (BUSINESS_WORDS.has(lower)) { business = true; continue }
    if (TRANSFER_WORDS.has(lower)) { transferWord = true; continue }
    if (ARROWS.has(lower)) { transferWord = transferWord || wallets.length > 0; continue }
    if (lower === 'fee' && next && parseMoney(next) != null) { fee = parseMoney(next); i++; continue }
    if ((lower === 'sell' || lower === 'sold' || lower === 'at') && next && parseRate(next) != null) { sellRate = parseRate(next); i++; continue }
    if (GOLD_WORDS.has(lower)) { goldWord = true; continue }

    const g = parseGold(t)
    if (g != null && gold == null) { gold = g; continue }

    // "@.17/.19" = buy / sell rates in one go
    const pair = t.match(/^@?(0?\.\d+)\/(0?\.\d+)$/)
    if (pair) { rates.push(parseFloat(pair[1])); sellRate = parseFloat(pair[2]); continue }
    const r = parseRate(t)
    if (r != null && (t.startsWith('@') || t.startsWith('.') || t.startsWith('0.'))) { rates.push(r); continue }

    const isPeso = /^(₱|p\d|php)/i.test(t) || /php$/i.test(t)
    const m = parseMoney(t)
    if (m != null) {
      if (isPeso && gold != null) phpPaid = m
      else money.push(m)
      continue
    }

    const w = findWallet(t, ctx.wallets)
    if (w && !wallets.some((x) => x.code === w.code)) { wallets.push(w); continue }

    words.push(t)
  }

  // ── Gold trade ──
  if (gold != null || (goldWord && rates.length > 0)) {
    if (!ctx.isAdmin) return { kind: 'error', message: 'Gold trades are only for the business side of the app.' }
    if (gold == null) return { kind: 'error', message: 'Add how much gold, e.g. 500kk or 1.8kkk.' }
    // A ₱ amount without the ₱ sign after the gold (e.g. "gold 500kk @.17 5400") is the ₱ paid
    if (phpPaid == null && money.length > 0) phpPaid = money[0]
    if (sellRate == null && rates.length > 1) sellRate = rates[1]
    return {
      kind: 'gold', gold, costRate: rates[0] ?? null, sellRate, phpPaid, wallet: wallets[0]?.code ?? null,
      description: capitalize(words.join(' ')), date,
    }
  }

  const amount = money[0] ?? null

  // ── Transfer: two wallets ──
  if (wallets.length >= 2 || (transferWord && wallets.length > 0)) {
    if (!ctx.isAdmin) return { kind: 'error', message: 'Transfers are only for the full Balance page.' }
    if (wallets.length < 2) return { kind: 'error', message: 'Name both accounts, e.g. "5000 maribank > gcash".' }
    if (amount == null) return { kind: 'error', message: 'Add the amount to move, e.g. "5000 maribank > gcash".' }
    const [from, to] = wallets
    if (from.currency !== to.currency) return { kind: 'error', message: `${from.name} and ${to.name} use different currencies. Use Transfer on the Balance page to enter what arrived.` }
    return { kind: 'transfer', amount, from: from.code, to: to.code, fee, date, note: words.length ? capitalize(words.join(' ')) : null }
  }

  // ── Daily expense / income ──
  if (amount == null) return { kind: 'error', message: 'Add an amount, e.g. "250 lunch gcash".' }
  if (wallets[0] && wallets[0].currency !== 'PHP') return { kind: 'error', message: `${wallets[0].name} is a dollar account; daily entries are in ₱.` }
  if (!income && words.some((w) => INCOME_WORDS.has(w.toLowerCase()))) income = true

  const description = capitalize(words.join(' '))
  const { category, usedWord } = findCategory(words, description, income ? 'income' : null, ctx)
  // The category decides the type when nothing else did ("250 salary" with a Salary income category)
  const type: 'income' | 'expense' = income ? 'income' : category?.type ?? 'expense'
  const finalCategory = category && category.type === type ? category : null
  const descWords = usedWord && words.length > 1 ? words.filter((w) => w !== usedWord) : words

  return {
    kind: 'daily', type, amount, description: capitalize(descWords.join(' ')),
    categoryId: finalCategory?.id ?? null, wallet: ctx.isAdmin ? wallets[0]?.code ?? null : null,
    business: ctx.isAdmin && business, date,
  }
}

/** ₱ value of gold at $rate per 1M and ₱phpRate per $. */
export const goldPhp = (gold: number, rate: number, phpRate: number) => Math.round((gold / 1_000_000) * rate * phpRate * 100) / 100
