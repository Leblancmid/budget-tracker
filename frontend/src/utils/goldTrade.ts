import type { BusinessTransaction } from '@/types'
import type { BusinessTransactionPayload } from '@/api/business'

const round2 = (v: number) => Math.round(v * 100) / 100

/** ₱ value of `gold` at the trade's rates; falls back to scaling the old ₱ value when rates are missing. */
function goldToPhp(gold: number, oldGold: number, usdRate: string | null, phpRate: string | null | undefined, oldPhp: string | null): number | null {
  if (gold === 0) return 0
  if (usdRate != null && phpRate != null && Number(usdRate) && Number(phpRate)) {
    return round2((gold / 1_000_000) * Number(usdRate) * Number(phpRate))
  }
  if (oldPhp != null && oldGold > 0) return round2(Number(oldPhp) * (gold / oldGold))
  return null
}

export interface GoldTopUp {
  oldPrice: number
  oldCost: number
  newPrice: number
  newCost: number
  pricePhp: number | null
  costPhp: number | null
  profitPhp: number | null
  /** Update payload for businessTransactionsApi.update */
  payload: BusinessTransactionPayload
}

/**
 * Add gold onto a gold trade's total price and/or cost, recalculating the ₱
 * values from the trade's own rates.
 */
export function goldTopUp(tx: BusinessTransaction, addPrice: number, addCost: number, addCostPhp = 0): GoldTopUp {
  const oldPrice  = Number(tx.price_gold ?? 0)
  const oldCost   = Number(tx.cost_gold ?? 0)
  const newPrice  = oldPrice + addPrice
  const newCost   = oldCost + addCost
  const pricePhp  = goldToPhp(newPrice, oldPrice, tx.price_rate, tx.php_rate, tx.price_php)
  // Cost paid in ₱: the cost grows by the extra ₱ paid, not by cost gold
  const costPhp   = costPaidInPhp(tx.cost_gold, tx.cost_php)
    ? round2(Number(tx.cost_php) + addCostPhp)
    : goldToPhp(newCost, oldCost, tx.cost_rate, tx.cost_php_rate ?? tx.php_rate, tx.cost_php)
  const profitPhp = pricePhp != null && costPhp != null ? pricePhp - costPhp : null
  return {
    oldPrice, oldCost, newPrice, newCost, pricePhp, costPhp, profitPhp,
    payload: {
      type:       'gold',
      date:       tx.date,
      // amount is required (> 0) by the API; profit drives it, with a floor
      amount:     profitPhp != null && profitPhp > 0 ? round2(profitPhp) : 0.01,
      price_gold: newPrice,
      cost_gold:  newCost,
      price_php:  pricePhp,
      cost_php:   costPhp,
    },
  }
}

/**
 * What buying `gold` costs in a Balance wallet's currency at a trade's cost rates
 * (the same as the server deducts): G / 1M × cost rate = $, × the ₱ rate for a peso wallet.
 * Null when there's nothing to pay or the rates are missing.
 */
export function goldWalletCost(
  gold: number | null,
  costRate: number | string | null | undefined,
  phpRate: number | string | null | undefined,
  currency: 'PHP' | 'USD',
): number | null {
  if (!gold || gold <= 0 || !Number(costRate)) return null
  const usd = (gold / 1_000_000) * Number(costRate)
  if (currency === 'USD') return round2(usd)
  return Number(phpRate) ? round2(usd * Number(phpRate)) : null
}

/**
 * Gold bought with money ("₱ paid"): no gold went out (Cost 0 G) and the cost is the ₱ paid.
 * Same rule as the server's BusinessTransaction::costPaidInPhp().
 */
export function costPaidInPhp(costGold: number | string | null | undefined, costPhp: number | string | null | undefined): boolean {
  return Number(costGold ?? 0) === 0 && Number(costPhp ?? 0) > 0
}
