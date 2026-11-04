import type { AccountClass } from '@/types'

/** Gold in trade-chat units (540KK, 1.5KKK): the same helper as the Listing Kit. */
export { formatGoldShort } from './listing'

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
