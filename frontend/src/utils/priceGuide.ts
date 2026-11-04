import type { AccountClass } from '@/types'

/** 1_500_000_000 → "1.5KKK", 540_000_000 → "540KK" (how gold is quoted in trade chats). */
export function formatGoldShort(g: number): string {
  const trim = (n: number, d: number) => String(Number(n.toFixed(d)))
  if (Math.abs(g) >= 1_000_000_000) return `${trim(g / 1_000_000_000, 2)}KKK`
  if (Math.abs(g) >= 1_000_000) return `${trim(g / 1_000_000, 1)}KK`
  return g.toLocaleString('en')
}

/**
 * Level and class for the price guide, the same way the server reads sold accounts: the
 * stats if filled in, otherwise the name ("Leblanc 640 Dist" → 640, distance).
 */
export function guessLevelAndClass(
  name: string,
  stats: { level?: string; melee?: string; distance?: string; magic?: string },
): { level: number | null; accountClass: AccountClass | null } {
  const level = Number(stats.level) || Number(name.match(/\b(\d{2,3})\b/)?.[1]) || null

  const skills = (['melee', 'distance', 'magic'] as const)
    .map((k) => [k, Number(stats[k]) || 0] as const)
    .sort((a, b) => b[1] - a[1])
  let accountClass: AccountClass | null = skills[0][1] > 0 ? skills[0][0] : null
  if (!accountClass) {
    const n = name.toLowerCase()
    if (/\b(dist|distance|archer|ranged?)\b/.test(n)) accountClass = 'distance'
    else if (/\b(mage|magic|wizard)\b/.test(n)) accountClass = 'magic'
    else if (/\b(melee|knight|warrior)\b/.test(n)) accountClass = 'melee'
  }
  return { level, accountClass }
}
