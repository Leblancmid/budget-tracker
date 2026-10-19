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
export function goldTopUp(tx: BusinessTransaction, addPrice: number, addCost: number): GoldTopUp {
  const oldPrice  = Number(tx.price_gold ?? 0)
  const oldCost   = Number(tx.cost_gold ?? 0)
  const newPrice  = oldPrice + addPrice
  const newCost   = oldCost + addCost
  const pricePhp  = goldToPhp(newPrice, oldPrice, tx.price_rate, tx.php_rate, tx.price_php)
  const costPhp   = goldToPhp(newCost, oldCost, tx.cost_rate, tx.cost_php_rate ?? tx.php_rate, tx.cost_php)
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
