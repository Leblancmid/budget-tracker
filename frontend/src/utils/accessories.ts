import bandana from '@/assets/accessories/bandana.png'
import crown from '@/assets/accessories/crown.png'
import hood from '@/assets/accessories/hood.png'
import necklaceGreen from '@/assets/accessories/necklace-green.png'
import necklacePurple from '@/assets/accessories/necklace-purple.png'
import necklaceBlue from '@/assets/accessories/necklace-blue.png'
import necklaceGold from '@/assets/accessories/necklace-gold.png'
import ringGreen from '@/assets/accessories/ring-green.png'
import ringPurple from '@/assets/accessories/ring-purple.png'
import ringBlue from '@/assets/accessories/ring-blue.png'
import ringGold from '@/assets/accessories/ring-gold.png'
import type { Rect } from './listing'

export type AccessoryKind = 'decoration' | 'buff'

export interface Accessory {
  key: string
  label: string
  kind: AccessoryKind
  src: string
}

/**
 * Every accessory an account can include, in the order they're drawn.
 * Keys must match RucoyAccount::ACCESSORIES on the backend.
 */
export const ACCESSORIES: Accessory[] = [
  { key: 'bandana',         label: 'Bandana',         kind: 'decoration', src: bandana },
  { key: 'crown',           label: 'Crown',           kind: 'decoration', src: crown },
  { key: 'hood',            label: 'Hood',            kind: 'decoration', src: hood },
  { key: 'necklace-green',  label: 'Green necklace',  kind: 'buff', src: necklaceGreen },
  { key: 'necklace-purple', label: 'Purple necklace', kind: 'buff', src: necklacePurple },
  { key: 'necklace-blue',   label: 'Blue necklace',   kind: 'buff', src: necklaceBlue },
  { key: 'necklace-gold',   label: 'Gold necklace',   kind: 'buff', src: necklaceGold },
  { key: 'ring-green',      label: 'Green ring',      kind: 'buff', src: ringGreen },
  { key: 'ring-purple',     label: 'Purple ring',     kind: 'buff', src: ringPurple },
  { key: 'ring-blue',       label: 'Blue ring',       kind: 'buff', src: ringBlue },
  { key: 'ring-gold',       label: 'Gold ring',       kind: 'buff', src: ringGold },
]

const BY_KEY = new Map(ACCESSORIES.map((a) => [a.key, a]))

/** Known accessories for these keys, in catalogue order (unknown keys are dropped). */
export function accessoriesFor(keys: readonly string[] | null | undefined): Accessory[] {
  const set = new Set(keys ?? [])
  return ACCESSORIES.filter((a) => set.has(a.key))
}

export const accessoryLabel = (key: string) => BY_KEY.get(key)?.label ?? key

/**
 * Where accessory icons go on a tile: a tidy grid in the bottom-left corner, over the
 * low-value timers (stamina, training) and clear of the stats, the name and the price tag.
 * Uses whichever number of columns gives the biggest icons.
 */
export function accessorySlots(count: number, tile: Rect): Rect[] {
  if (count <= 0) return []
  const zone = { x: tile.x + tile.w * 0.02, y: tile.y + tile.h * 0.595, w: tile.w * 0.21, h: tile.h * 0.375 }
  const gap = tile.w * 0.01
  // Never bigger than two-per-row, so icons are the same size on every tile
  const maxSize = (zone.w - gap) / 2
  const sizeFor = (cols: number) => {
    const rows = Math.ceil(count / cols)
    return Math.min(maxSize, (zone.w - (cols - 1) * gap) / cols, (zone.h - (rows - 1) * gap) / rows)
  }
  // Biggest icons wins; on a tie, more per row (a row reads better than a column)
  let cols = 1
  for (let c = 2; c <= count; c++) if (sizeFor(c) >= sizeFor(cols)) cols = c
  const size = sizeFor(cols)
  return Array.from({ length: count }, (_, i) => ({
    x: zone.x + (i % cols) * (size + gap),
    y: zone.y + Math.floor(i / cols) * (size + gap),
    w: size,
    h: size,
  }))
}

/** The box around all slots, grown by `pad` on every side (for the tray behind them). */
export function slotsBounds(slots: Rect[], pad: number): Rect | null {
  if (!slots.length) return null
  const x = Math.min(...slots.map((s) => s.x)) - pad
  const y = Math.min(...slots.map((s) => s.y)) - pad
  const right = Math.max(...slots.map((s) => s.x + s.w)) + pad
  const bottom = Math.max(...slots.map((s) => s.y + s.h)) + pad
  return { x, y, w: right - x, h: bottom - y }
}
