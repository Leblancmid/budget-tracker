/**
 * An account's exact ₱ cost, the same way the server works it out (AccountCost.php):
 * the paid part is the sum of its payments (each at its own rates); gold not yet paid is
 * valued at the account's typed cost rates. Null when part of it can't be valued yet.
 */
export function accountCostPhp(
  paid: { gold: number; php: number },
  costGold: number | null,
  costRate: number | null,
  costPhpRate: number | null,
): number | null {
  const unpaid = Math.max(0, (costGold ?? 0) - paid.gold)
  if (unpaid <= 0) return round2(paid.php)
  if (!costRate || !costPhpRate) return null
  return round2(paid.php + (unpaid / 1_000_000) * costRate * costPhpRate)
}

/** The single rate that gives the same ₱ for the gold paid ($ per 1M × ₱ rate folded together). */
export function blendedPhpPerMillion(paid: { gold: number; php: number }): number | null {
  return paid.gold > 0 ? paid.php / (paid.gold / 1_000_000) : null
}

/**
 * ₱ that taking `gold` out of a trade carries over: its cost ₱ by the share of cost gold taken.
 * Gold bought with ₱ (no cost gold): by the share of the price gold taken, like the server.
 */
export function tradeShareCostPhp(trade: { price_gold?: number | null; cost_gold: number | null; cost_php: number | null }, gold: number): number | null {
  if (trade.cost_php == null) return null
  if (!trade.cost_gold) {
    const price = trade.price_gold ?? 0
    if (trade.cost_php === 0) return 0 // free gold (e.g. middleman fees)
    return price > 0 ? round2(trade.cost_php * Math.min(gold / price, 1)) : null
  }
  const taken = Math.min(gold, trade.cost_gold)
  return round2(trade.cost_php * (taken / trade.cost_gold))
}

const round2 = (n: number) => Math.round(n * 100) / 100
