import type { BalanceAccountConfig, BalanceEntry } from '@/types'

export interface AccountStats { balance: number; count: number; last: string | null }

export interface BalanceTotals { usd: number; php: number; usdCount: number; phpCount: number; net: number }

export interface Allocation {
  /** Sum of positive balances, in ₱ */
  sum: number
  parts: { a: BalanceAccountConfig; value: number; share: number }[]
}

/** Balance, entry count and latest entry date per account code. */
export function accountStats(entries: BalanceEntry[]): Map<string, AccountStats> {
  const map = new Map<string, AccountStats>()
  for (const e of entries) {
    const s = map.get(e.account) ?? { balance: 0, count: 0, last: null }
    const amt = parseFloat(e.amount)
    s.balance += e.type === 'add' ? amt : -amt
    s.count   += 1
    if (!s.last || e.date > s.last) s.last = e.date
    map.set(e.account, s)
  }
  return map
}

/** An account's balance in ₱ (USD accounts converted at `phpRate`). */
export const toPhp = (a: BalanceAccountConfig, n: number, phpRate: number) => (a.currency === 'USD' ? n * phpRate : n)

/** USD / PHP totals and net worth in ₱. Hidden accounts count: hiding only declutters the page. */
export function balanceTotals(accounts: BalanceAccountConfig[], stats: Map<string, AccountStats>, phpRate: number): BalanceTotals {
  let usd = 0, php = 0, usdCount = 0, phpCount = 0
  for (const a of accounts) {
    const b = stats.get(a.code)?.balance ?? 0
    if (a.currency === 'USD') { usd += b; usdCount++ } else { php += b; phpCount++ }
  }
  return { usd, php, usdCount, phpCount, net: php + usd * phpRate }
}

/** Share of each positive balance, in ₱, largest first. */
export function allocation(accounts: BalanceAccountConfig[], stats: Map<string, AccountStats>, phpRate: number): Allocation {
  const parts = accounts
    .map((a) => ({ a, value: toPhp(a, stats.get(a.code)?.balance ?? 0, phpRate) }))
    .filter((p) => p.value > 0)
  const sum = parts.reduce((s, p) => s + p.value, 0)
  return { sum, parts: parts.map((p) => ({ ...p, share: sum > 0 ? p.value / sum : 0 })).sort((x, y) => y.value - x.value) }
}

/** "12%" for big shares, "4.5%" for small ones. */
export const formatShare = (share: number) => `${(share * 100).toFixed(share < 0.1 ? 1 : 0)}%`
