export type CashCurrency = 'PHP' | 'USD'

/** ₱ value of a cash amount: pesos as-is, dollars × the ₱ rate (null until both are known). */
export function cashToPhp(amount: string, currency: CashCurrency, phpRate: string): number | null {
  if (amount === '') return null
  const n = parseFloat(amount)
  if (!Number.isFinite(n)) return null
  if (currency === 'PHP') return n
  const rate = parseFloat(phpRate)
  return rate ? n * rate : null
}

/** "₱8,000" / "$150" for a cash price (no decimals when whole). */
export function formatCash(amount: number, currency: CashCurrency | string | null): string {
  const symbol = currency === 'USD' ? '$' : '₱'
  return `${symbol}${amount.toLocaleString('en', { maximumFractionDigits: 2 })}`
}
