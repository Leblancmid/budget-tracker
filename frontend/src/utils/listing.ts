import type { RucoyAccount } from '@/types'

/** How an account is marketed: its highest attack skill. */
export type AccountBuild = 'Melee' | 'Distance' | 'Magic'

const DAY_MS = 86_400_000

/**
 * Rucoy gold shorthand used in listings: K = thousand, KK = million, KKK = billion.
 * 700,000,000 → "700KK", 1,800,000,000 → "1.8KKK", 1,250,000 → "1.25KK".
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

/** The build an account is sold as, from its highest attack skill (null until stats are entered). */
export function accountBuild(a: Pick<RucoyAccount, 'melee' | 'distance' | 'magic'>): AccountBuild | null {
  const skills: [AccountBuild, number | null][] = [['Melee', a.melee], ['Distance', a.distance], ['Magic', a.magic]]
  const known = skills.filter((s): s is [AccountBuild, number] => s[1] != null)
  if (known.length === 0) return null
  return known.reduce((best, s) => (s[1] > best[1] ? s : best))[0]
}

/** Whole days an account has been (or was) up for sale. */
export function daysListed(listedAt: string | null, untilMs: number): number | null {
  if (!listedAt) return null
  const start = Date.parse(listedAt)
  if (Number.isNaN(start)) return null
  return Math.max(0, Math.floor((untilMs - start) / DAY_MS))
}

/** Gets the "NEW" ribbon while it was listed less than `newForDays` days ago. */
export function isNewListing(listedAt: string | null, nowMs: number, newForDays: number): boolean {
  if (!listedAt || newForDays <= 0) return false
  const start = Date.parse(listedAt)
  return !Number.isNaN(start) && nowMs - start < newForDays * DAY_MS
}

/** "Lv 618 Melee" — falls back to the description when stats are missing. */
export function listingTitle(a: Pick<RucoyAccount, 'level' | 'melee' | 'distance' | 'magic' | 'description' | 'email'>): string {
  const build = accountBuild(a)
  if (a.level != null) return build ? `Lv ${a.level} ${build}` : `Lv ${a.level}`
  return a.description || a.email
}

/** Highest level first, so the best accounts lead the image. */
export function sortForListing<T extends Pick<RucoyAccount, 'level' | 'id'>>(accounts: T[]): T[] {
  return [...accounts].sort((a, b) => (b.level ?? 0) - (a.level ?? 0) || b.id - a.id)
}

export interface Rect { x: number; y: number; w: number; h: number }

export interface ListingLayout {
  width: number
  height: number
  tiles: Rect[]
  /** Band under the grid for promo pills and the website link (null when there's nothing to show) */
  footer: Rect | null
}

export const TILE_W = 640
export const TILE_H = 427 // in-game stats screenshots are ~3:2
export const GAP = 8
export const FOOTER_H = 120

/** Grid of `count` tiles in `columns` columns, plus an optional footer band. */
export function listingLayout(count: number, columns: number, withFooter: boolean): ListingLayout {
  const cols = Math.max(1, Math.min(columns, Math.max(count, 1)))
  const rows = Math.max(1, Math.ceil(count / cols))
  const width = cols * TILE_W + (cols + 1) * GAP
  const gridH = rows * TILE_H + (rows + 1) * GAP

  const tiles = Array.from({ length: count }, (_, i) => ({
    x: GAP + (i % cols) * (TILE_W + GAP),
    y: GAP + Math.floor(i / cols) * (TILE_H + GAP),
    w: TILE_W,
    h: TILE_H,
  }))

  const footer = withFooter ? { x: 0, y: gridH, w: width, h: FOOTER_H } : null
  return { width, height: gridH + (footer ? FOOTER_H : 0), tiles, footer }
}

/** Source crop that fills a tile without stretching (CSS object-fit: cover). */
export function coverCrop(srcW: number, srcH: number, dstW: number, dstH: number): Rect {
  const scale = Math.max(dstW / srcW, dstH / srcH)
  const w = dstW / scale
  const h = dstH / scale
  return { x: (srcW - w) / 2, y: (srcH - h) / 2, w, h }
}

export interface CaptionOptions {
  headline: string
  link: string
  promos: string[]
}

/** Text to paste with the image: one line per account, then promos and the link. */
export function listingCaption(
  accounts: Pick<RucoyAccount, 'level' | 'melee' | 'distance' | 'magic' | 'description' | 'email' | 'price' | 'show_price'>[],
  { headline, link, promos }: CaptionOptions,
): string {
  const lines = accounts.map((a) => {
    const price = a.show_price && a.price ? formatGoldShort(a.price) : 'DM for price'
    return `• ${listingTitle(a)} — ${price}`
  })
  return [
    headline.trim(),
    '',
    ...lines,
    ...(promos.length ? ['', ...promos.map((p) => `✅ ${p}`)] : []),
    ...(link.trim() ? ['', `More details: ${link.trim()}`] : []),
  ].filter((line, i, all) => !(line === '' && (i === 0 || all[i - 1] === ''))).join('\n').trim()
}

/** Same-origin path for an uploaded file, so a canvas that draws it can still be exported. */
export function sameOriginPath(url: string): string {
  try {
    const u = new URL(url, 'http://placeholder')
    return u.pathname + u.search
  } catch {
    return url
  }
}

export const SCREENSHOT_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024

/** Same limits as the API, checked before upload. Returns an error message or null. */
export function screenshotError(file: Pick<File, 'type' | 'size'>): string | null {
  if (!SCREENSHOT_TYPES.includes(file.type)) return 'Use a PNG, JPG or WebP image.'
  if (file.size > SCREENSHOT_MAX_BYTES) return 'The image must be 5 MB or smaller.'
  return null
}
