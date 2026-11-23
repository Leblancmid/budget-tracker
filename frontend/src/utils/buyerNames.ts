/**
 * Buyer names as typed in "Sold to": one buyer however it was written ("Dark Knight",
 * "darkknight", "Dark.Knight"), the same rule as the server's Buyers::key.
 */
export const buyerKey = (name: string) => name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

/** Letters to change to turn a into b (insert, delete or replace one at a time) */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3 // more than we'll call a typo anyway
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = row
  }
  return prev[b.length]
}

/**
 * A past buyer this name probably means, written differently: the same name with other spacing,
 * dots or capitals, or a small typo (1 letter off for short names, 2 for longer ones). Null when
 * it's exactly a known buyer, or nobody close. The closest (then most recent) wins.
 */
export function didYouMean(typed: string, known: string[]): string | null {
  const key = buyerKey(typed)
  if (key.length < 3 || known.some((n) => n.trim() === typed.trim())) return null

  const same = known.find((n) => buyerKey(n) === key)
  if (same) return same

  const allowed = key.length >= 7 ? 2 : key.length >= 4 ? 1 : 0
  let best: { name: string; d: number } | null = null
  for (const name of known) {
    const d = editDistance(key, buyerKey(name))
    if (d <= allowed && (!best || d < best.d)) best = { name, d }
  }
  return best?.name ?? null
}
