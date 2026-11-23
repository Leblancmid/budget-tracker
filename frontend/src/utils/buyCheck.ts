import type { PriceGuide } from '@/types'

/**
 * good: at or under the most to pay for your usual margin · tight: under what similar ones sell
 * for, but a thin margin · bad: at or over what similar ones sell for · unknown: no price yet, or
 * no similar sales to compare with.
 */
export type BuyVerdict = 'good' | 'tight' | 'bad' | 'unknown'

export interface BuyCheck {
  verdict: BuyVerdict
  /** What similar accounts sold for, in the asking currency */
  typical: number | null
  /** The most to pay and keep your usual margin (or DEFAULT_MARGIN when it isn't known) */
  maxBuy: number | null
  /** The margin maxBuy keeps, as a % */
  margin: number | null
  /** No usual margin from your sales yet (no costs recorded): DEFAULT_MARGIN is used */
  assumedMargin: boolean
  /** Typical price − asking price */
  profit: number | null
  /** ₱ or gold, whichever the asking price was in */
  unit: 'php' | 'gold'
}

/** The margin to aim for when your sales don't show a usual one yet */
export const DEFAULT_MARGIN = 20

/** How an asking price (₱ or gold) compares with what similar accounts sold for. */
export function checkBuy(guide: PriceGuide['account'], askPhp: number | null, askGold: number | null): BuyCheck {
  const unit = askGold != null ? 'gold' : 'php'
  const ask = askGold ?? askPhp
  const typical = unit === 'gold' ? guide.price_gold : guide.price_php
  const known = unit === 'gold' ? guide.max_buy_gold : guide.max_buy_php
  // Without a usual margin, aim for DEFAULT_MARGIN below what similar ones sold for
  const assumedMargin = known == null && typical != null
  const maxBuy = known ?? (typical != null ? typical * (1 - DEFAULT_MARGIN / 100) : null)
  const margin = assumedMargin ? DEFAULT_MARGIN : guide.usual_margin
  if (ask == null || typical == null) return { verdict: 'unknown', typical, maxBuy, margin, assumedMargin, profit: null, unit }

  const verdict: BuyVerdict = maxBuy != null && ask <= maxBuy ? 'good' : ask < typical ? 'tight' : 'bad'
  return { verdict, typical, maxBuy, margin, assumedMargin, profit: typical - ask, unit }
}
