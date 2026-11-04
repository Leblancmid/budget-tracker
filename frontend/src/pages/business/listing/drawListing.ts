import { coverCrop, cropRegion, listingLayout, promoTiles, wrapText, type CropInsets, type Rect } from '@/utils/listing'

export interface ListingTile {
  image: HTMLImageElement
  isNew: boolean
  /** e.g. "700KK"; null hides the price tag */
  priceLabel: string | null
}

export interface DrawOptions {
  columns: number
  promos: string[]
  crop: CropInsets
}

const BG        = '#000000'
const RIBBON    = '#e3262f'
const PILL      = '#3cb878'
const PILL_TEXT = '#ffffff'
const FONT      = '"Segoe UI", system-ui, sans-serif'

/** Paint the shareable listing image (the grid you post in Discord) onto `canvas`. */
export function drawListing(canvas: HTMLCanvasElement, tiles: ListingTile[], opts: DrawOptions): void {
  const layout = listingLayout(tiles.length, opts.columns)
  canvas.width  = layout.width
  canvas.height = layout.height

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, layout.width, layout.height)

  tiles.forEach((tile, i) => {
    const r = layout.tiles[i]
    const img = tile.image
    const src = coverCrop(cropRegion(img.naturalWidth, img.naturalHeight, opts.crop), r.w, r.h)
    // Shrinking a phone screenshot needs smoothing or the text turns jagged;
    // enlarging pixel art looks sharper without it.
    const enlarging = src.w < r.w
    ctx.imageSmoothingEnabled = !enlarging
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, src.x, src.y, src.w, src.h, r.x, r.y, r.w, r.h)
  })

  // Tags on top of the screenshots, like the Canva layout
  const promos = opts.promos.map((p) => p.trim().toUpperCase()).filter(Boolean)
  const promoAt = new Map(promoTiles(promos.length, opts.columns, tiles.map((t) => !!t.priceLabel)).map((tileIdx, k) => [tileIdx, promos[k]]))

  tiles.forEach((tile, i) => {
    const r = layout.tiles[i]
    if (tile.isNew) drawRibbon(ctx, r)
    if (tile.priceLabel) drawPill(ctx, [tile.priceLabel], r.x + r.w * 0.025, r.y + r.h * 0.42, 62)
    const promo = promoAt.get(i)
    if (promo) {
      const size = 50
      ctx.font = pillFont(size)
      const lines = wrapText(promo, r.w * 0.42, (s) => ctx.measureText(s).width)
      const h = pillHeight(size, lines.length)
      drawPill(ctx, lines, r.x + r.w * 0.025, r.y + r.h - h - r.h * 0.04, size)
    }
  })
}

const pillFont = (size: number) => `800 ${size}px ${FONT}`
const pillHeight = (size: number, lines: number) => size * (0.5 + 1.15 * lines)

/** Red "NEW" sash across the top-left corner. */
function drawRibbon(ctx: CanvasRenderingContext2D, r: Rect) {
  const s = r.w / 1000 // sized for a 1000px tile
  ctx.save()
  ctx.beginPath()
  ctx.rect(r.x, r.y, r.w, r.h)
  ctx.clip()
  ctx.translate(r.x + 100 * s, r.y + 100 * s)
  ctx.rotate(-Math.PI / 4)
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 12 * s
  ctx.fillStyle = RIBBON
  ctx.fillRect(-220 * s, -42 * s, 440 * s, 84 * s)
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 ${54 * s}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('NEW', 0, 3 * s)
  ctx.restore()
}

/** Rounded green tag; multi-line text is centred. Returns its width. */
function drawPill(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, size: number): number {
  ctx.save()
  ctx.font = pillFont(size)
  const padX = size * 0.45
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + padX * 2
  const h = pillHeight(size, lines.length)
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 10
  ctx.fillStyle = PILL
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, size * 0.28)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = PILL_TEXT
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, y + size * 0.25 + size * 1.15 * (i + 0.5) + 2))
  ctx.restore()
  return w
}

/** Discord rejects uploads over 10 MB (free accounts); stay a little under. */
export const DISCORD_MAX_BYTES = 9.5 * 1024 * 1024

/**
 * A PNG of the canvas small enough for Discord: full size when it fits, otherwise
 * scaled down step by step. Returns the blob and the scale used.
 */
export async function pngUnder(canvas: HTMLCanvasElement, maxBytes = DISCORD_MAX_BYTES): Promise<{ blob: Blob; scale: number }> {
  let blob = await canvasToBlob(canvas)
  if (blob.size <= maxBytes) return { blob, scale: 1 }
  for (const scale of [0.85, 0.7, 0.55, 0.4]) {
    const small = document.createElement('canvas')
    small.width  = Math.round(canvas.width * scale)
    small.height = Math.round(canvas.height * scale)
    const ctx = small.getContext('2d')
    if (!ctx) break
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(canvas, 0, 0, small.width, small.height)
    blob = await canvasToBlob(small)
    if (blob.size <= maxBytes) return { blob, scale }
  }
  return { blob, scale: 0.4 }
}

/** The canvas as an image blob (PNG is the only type the clipboard accepts). */
export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))), type, quality)
  })
}
