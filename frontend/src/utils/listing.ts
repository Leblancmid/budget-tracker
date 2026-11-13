import { accessoriesFor } from './accessories'
import { formatCash } from './cash'
import { formatGoldShort } from './goldShort'
import type { RucoyAccount } from '@/types'

/** How an account is marketed: its highest attack skill. */
export type AccountBuild = 'Melee' | 'Distance' | 'Magic'

const DAY_MS = 86_400_000

export { formatGoldShort }

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
}

// Large tiles so buyers can click the image in Discord and zoom in on the stats.
// The aspect matches the cropped stats panel (~1.55:1), like the Canva version.
export const TILE_W = 1000
export const TILE_H = 645
export const GAP = 10

/** Grid of `count` tiles in `columns` columns. */
export function listingLayout(count: number, columns: number): ListingLayout {
  const cols = Math.max(1, Math.min(columns, Math.max(count, 1)))
  const rows = Math.max(1, Math.ceil(count / cols))

  const tiles = Array.from({ length: count }, (_, i) => ({
    x: GAP + (i % cols) * (TILE_W + GAP),
    y: GAP + Math.floor(i / cols) * (TILE_H + GAP),
    w: TILE_W,
    h: TILE_H,
  }))

  return { width: cols * TILE_W + (cols + 1) * GAP, height: rows * TILE_H + (rows + 1) * GAP, tiles }
}

/** How much of each screenshot edge to cut off, in % of its width/height. */
export interface CropInsets { top: number; right: number; bottom: number; left: number }

/**
 * Default: just the Stats panel. Cuts the menu buttons at the top and the labels on the
 * left, keeping the tail of Exp/HP/MP/Speed/Gold plus Level, Melee, Distance, Magic, Defense.
 */
export const DEFAULT_CROP: CropInsets = { top: 21, right: 10, bottom: 0, left: 35 }

/** The part of a screenshot left after cutting `insets` off its edges (never empty). */
export function cropRegion(srcW: number, srcH: number, insets: CropInsets): Rect {
  const pct = (v: number) => Math.min(Math.max(v, 0), 95) / 100
  const left = pct(insets.left), right = pct(insets.right)
  const top = pct(insets.top), bottom = pct(insets.bottom)
  const w = Math.max(srcW * (1 - left - right), srcW * 0.05)
  const h = Math.max(srcH * (1 - top - bottom), srcH * 0.05)
  return { x: Math.min(srcW * left, srcW - w), y: Math.min(srcH * top, srcH - h), w, h }
}

/** Part of `region` that fills a tile without stretching (CSS object-fit: cover), centred. */
export function coverCrop(region: Rect, dstW: number, dstH: number): Rect {
  const scale = Math.max(dstW / region.w, dstH / region.h)
  const w = dstW / scale
  const h = dstH / scale
  return { x: region.x + (region.w - w) / 2, y: region.y + (region.h - h) / 2, w, h }
}

/** What already sits on a tile, for deciding where promo tags go. */
export interface TileContent { price: boolean; accessories: boolean }

/**
 * Which tile each promo tag goes on. Promos sit bottom-left, where accessories also go,
 * so tiles with accessories come last; tiles with a price tag next to last. Among equals,
 * the first column comes first (like the Canva layout), then left to right.
 */
export function promoTiles(promoCount: number, columns: number, tiles: TileContent[]): number[] {
  const cols = Math.max(columns, 1)
  const score = (t: TileContent) => (t.accessories ? 2 : 0) + (t.price ? 1 : 0)
  return tiles
    .map((t, i) => ({ i, score: score(t), firstCol: i % cols === 0 ? 0 : 1 }))
    .sort((a, b) => a.score - b.score || a.firstCol - b.firstCol || a.i - b.i)
    .slice(0, promoCount)
    .map((t) => t.i)
}

/** Split text into lines no wider than `maxWidth` (a single long word stays on its own line). */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word
    if (line && measure(next) > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

type PricedAccount = Pick<RucoyAccount, 'price' | 'deal_type' | 'price_cash' | 'cash_currency'>

/** The asking price as buyers see it: "700KK" for gold deals, "₱8,000" / "$150" for cash deals. */
export function listingPrice(a: PricedAccount): string | null {
  if (a.deal_type === 'cash') return a.price_cash ? formatCash(a.price_cash, a.cash_currency) : null
  return a.price ? formatGoldShort(a.price) : null
}

export interface CaptionOptions {
  headline: string
  link: string
  promos: string[]
}

/** Text to paste with the image: one line per account, then promos and the link. */
export function listingCaption(
  accounts: Pick<RucoyAccount, 'level' | 'melee' | 'distance' | 'magic' | 'description' | 'email' | 'price' | 'show_price' | 'accessories' | 'deal_type' | 'price_cash' | 'cash_currency'>[],
  { headline, link, promos }: CaptionOptions,
): string {
  const lines = accounts.map((a) => {
    const price = (a.show_price && listingPrice(a)) || 'DM for price'
    const extras = accessoriesFor(a.accessories).map((x) => x.label)
    return `• ${listingTitle(a)}${extras.length ? ` + ${extras.join(', ')}` : ''} — ${price}`
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
