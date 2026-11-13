/**
 * Rucoy gold shorthand used in trade chat and listings: K = thousand, KK = million, KKK = billion.
 * 700,000,000 → "700KK", 1,800,000,000 → "1.8KKK", 1,250,000 → "1.25KK".
 * Kept on its own (no other imports) so small UI pieces can use it without pulling in the listing code.
 */
export function formatGoldShort(gold: number): string {
  const units: [number, string][] = [[1e9, 'KKK'], [1e6, 'KK'], [1e3, 'K']]
  for (const [size, suffix] of units) {
    if (gold >= size) {
      const value = Math.round((gold / size) * 100) / 100
      return `${value}${suffix}`
    }
  }
  return String(Math.round(gold))
}
