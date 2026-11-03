import { coverCrop, listingLayout, type Rect } from '@/utils/listing'

export interface ListingTile {
  image: HTMLImageElement
  isNew: boolean
  /** e.g. "700KK"; null hides the price tag */
  priceLabel: string | null
}

export interface DrawOptions {
  columns: number
  promos: string[]
  link: string
}

const BG          = '#0b0d12'
const RIBBON      = '#e11d2a'
const PILL        = '#2fae6b'
const PILL_TEXT   = '#ffffff'
const FOOTER_TEXT = '#e5e7eb'
const FONT        = '"Segoe UI", system-ui, sans-serif'

/** Paint the shareable listing image (the grid you post in Discord) onto `canvas`. */
export function drawListing(canvas: HTMLCanvasElement, tiles: ListingTile[], opts: DrawOptions): void {
  const promos = opts.promos.filter((p) => p.trim())
  const layout = listingLayout(tiles.length, opts.columns, promos.length > 0 || opts.link.trim() !== '')
  canvas.width  = layout.width
  canvas.height = layout.height

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, layout.width, layout.height)
  ctx.imageSmoothingEnabled = false // pixel-art screenshots stay crisp

  tiles.forEach((tile, i) => {
    const r = layout.tiles[i]
    const crop = coverCrop(tile.image.naturalWidth, tile.image.naturalHeight, r.w, r.h)
    ctx.drawImage(tile.image, crop.x, crop.y, crop.w, crop.h, r.x, r.y, r.w, r.h)
    if (tile.isNew) drawRibbon(ctx, r)
    if (tile.priceLabel) drawPill(ctx, tile.priceLabel, r.x + 16, r.y + r.h - 16 - 64, 44)
  })

  if (layout.footer) drawFooter(ctx, layout.footer, promos, opts.link.trim())
}

/** Red "NEW" sash across the top-left corner. */
function drawRibbon(ctx: CanvasRenderingContext2D, r: Rect) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(r.x, r.y, r.w, r.h)
  ctx.clip()
  ctx.translate(r.x + 62, r.y + 62)
  ctx.rotate(-Math.PI / 4)
  ctx.fillStyle = RIBBON
  ctx.fillRect(-120, -26, 240, 52)
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 30px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('NEW', 0, 1)
  ctx.restore()
}

/** Rounded green tag with white text; returns its width. */
function drawPill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number): number {
  ctx.save()
  ctx.font = `800 ${fontSize}px ${FONT}`
  const padX = fontSize * 0.55
  const h = fontSize * 1.45
  const w = ctx.measureText(text).width + padX * 2
  ctx.fillStyle = PILL
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h * 0.22)
  ctx.fill()
  ctx.fillStyle = PILL_TEXT
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + padX, y + h / 2 + 1)
  ctx.restore()
  return w
}

/** Promo pills on the left, website link on the right. */
function drawFooter(ctx: CanvasRenderingContext2D, f: Rect, promos: string[], link: string) {
  const size = 34
  const pillH = size * 1.45
  const y = f.y + (f.h - pillH) / 2
  let x = f.x + 24
  for (const promo of promos) x += drawPill(ctx, promo.trim().toUpperCase(), x, y, size) + 16

  if (link) {
    ctx.save()
    ctx.font = `600 32px ${FONT}`
    ctx.fillStyle = FOOTER_TEXT
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(link.replace(/^https?:\/\//, '').replace(/\/$/, ''), f.x + f.w - 24, f.y + f.h / 2)
    ctx.restore()
  }
}

/** The canvas as a PNG blob (the only image type the clipboard accepts). */
export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))), type, quality)
  })
}
