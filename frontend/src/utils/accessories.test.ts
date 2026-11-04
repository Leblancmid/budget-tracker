import { describe, expect, it } from 'vitest'
import { ACCESSORIES, accessoriesFor, accessorySlots, slotsBounds } from './accessories'
import php from '../../../backend/app/Models/RucoyAccount.php?raw'

const TILE = { x: 0, y: 0, w: 1000, h: 645 }

describe('ACCESSORIES', () => {
  it('matches the keys the backend accepts', () => {
    const block = php.match(/const ACCESSORIES = \[([\s\S]*?)\];/)?.[1] ?? ''
    const backendKeys = [...block.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]).sort()
    expect(ACCESSORIES.map((a) => a.key).sort()).toEqual(backendKeys)
  })
})

describe('accessoriesFor', () => {
  it('returns known ones in catalogue order (decorations first)', () => {
    expect(accessoriesFor(['ring-green', 'crown', 'nope']).map((a) => a.key)).toEqual(['crown', 'ring-green'])
    expect(accessoriesFor(null)).toEqual([])
  })
})

describe('accessorySlots', () => {
  it('puts icons two per row in the bottom-left, same size, inside the tile', () => {
    const slots = accessorySlots(3, TILE)
    expect(slots).toHaveLength(3)
    expect(new Set(slots.map((s) => s.w)).size).toBe(1)
    expect(slots[0].y).toBe(slots[1].y)             // first row
    expect(slots[2].x).toBe(slots[0].x)             // wraps under the first
    expect(slots[0].y).toBeGreaterThan(TILE.h * 0.55) // below the price tag
    for (const s of slots) {
      expect(s.x + s.w).toBeLessThanOrEqual(TILE.w * 0.25) // clear of the stats column
      expect(s.y + s.h).toBeLessThanOrEqual(TILE.h)
    }
  })

  it('picks the row layout that gives the biggest icons, still inside the corner', () => {
    const five = accessorySlots(5, TILE)
    const fiveSize = five[0].w
    // Bigger than squeezing three per row into the same width would allow
    expect(fiveSize).toBeGreaterThan((TILE.w * 0.21 - 2 * TILE.w * 0.01) / 3)
    for (const s of five) {
      expect(s.x + s.w).toBeLessThanOrEqual(TILE.w * 0.25)
      expect(s.y + s.h).toBeLessThanOrEqual(TILE.h)
    }
    expect(accessorySlots(0, TILE)).toEqual([])
  })
})

describe('accessorySlots consistency', () => {
  it('uses the same icon size for one to four items, laid out in rows', () => {
    const sizes = [1, 2, 3, 4].map((n) => accessorySlots(n, TILE)[0].w)
    expect(new Set(sizes).size).toBe(1)
    const two = accessorySlots(2, TILE)
    expect(two[0].y).toBe(two[1].y) // side by side, not stacked
  })
})

describe('slotsBounds', () => {
  it('wraps all slots with padding', () => {
    expect(slotsBounds([{ x: 10, y: 20, w: 5, h: 5 }, { x: 30, y: 20, w: 5, h: 5 }], 2)).toEqual({ x: 8, y: 18, w: 29, h: 9 })
    expect(slotsBounds([], 2)).toBeNull()
  })
})
