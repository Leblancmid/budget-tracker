import { describe, expect, it } from 'vitest'
import type { RucoyAccount } from '@/types'
import {
  accountBuild, coverCrop, daysListed, formatGoldShort, isNewListing, listingCaption,
  listingLayout, listingTitle, sameOriginPath, screenshotError, sortForListing, FOOTER_H, GAP, TILE_H, TILE_W,
} from './listing'

const account = (overrides: Partial<RucoyAccount> = {}) => ({
  id: 1, description: 'Acc', email: 'a@example.com', level: 618, hp: 9370,
  melee: 602, distance: 378, magic: 485, defense: 552,
  price: 700_000_000, show_price: true, listed_at: '2026-11-01T00:00:00Z',
  ...overrides,
}) as RucoyAccount

const NOV_3 = Date.parse('2026-11-03T12:00:00Z')

describe('formatGoldShort', () => {
  it('uses K / KK / KKK shorthand', () => {
    expect(formatGoldShort(700_000_000)).toBe('700KK')
    expect(formatGoldShort(1_800_000_000)).toBe('1.8KKK')
    expect(formatGoldShort(1_250_000)).toBe('1.25KK')
    expect(formatGoldShort(500_000)).toBe('500K')
    expect(formatGoldShort(950)).toBe('950')
  })
})

describe('accountBuild', () => {
  it('is the highest attack skill', () => {
    expect(accountBuild(account())).toBe('Melee')
    expect(accountBuild(account({ melee: 336, distance: 648, magic: 330 }))).toBe('Distance')
    expect(accountBuild(account({ melee: null, distance: null, magic: 641 }))).toBe('Magic')
  })

  it('is unknown without stats', () => {
    expect(accountBuild(account({ melee: null, distance: null, magic: null }))).toBeNull()
  })
})

describe('listing dates', () => {
  it('counts whole days listed', () => {
    expect(daysListed('2026-11-01T00:00:00Z', NOV_3)).toBe(2)
    expect(daysListed(null, NOV_3)).toBeNull()
    expect(daysListed('not a date', NOV_3)).toBeNull()
  })

  it('marks recent listings as new', () => {
    expect(isNewListing('2026-11-01T00:00:00Z', NOV_3, 3)).toBe(true)
    expect(isNewListing('2026-10-30T00:00:00Z', NOV_3, 3)).toBe(false)
    expect(isNewListing('2026-11-03T00:00:00Z', NOV_3, 0)).toBe(false)
    expect(isNewListing(null, NOV_3, 3)).toBe(false)
  })
})

describe('listingTitle / sortForListing', () => {
  it('names the account by level and build, else by description', () => {
    expect(listingTitle(account())).toBe('Lv 618 Melee')
    expect(listingTitle(account({ level: null }))).toBe('Acc')
    expect(listingTitle(account({ level: null, description: null }))).toBe('a@example.com')
  })

  it('puts the highest level first', () => {
    const sorted = sortForListing([account({ id: 1, level: 600 }), account({ id: 2, level: 721 }), account({ id: 3, level: null })])
    expect(sorted.map((a) => a.id)).toEqual([2, 1, 3])
  })
})

describe('listingLayout', () => {
  it('lays tiles out in a grid with a footer band', () => {
    const l = listingLayout(5, 3, true)
    expect(l.width).toBe(3 * TILE_W + 4 * GAP)
    expect(l.height).toBe(2 * TILE_H + 3 * GAP + FOOTER_H)
    expect(l.tiles[4]).toEqual({ x: GAP + TILE_W + GAP, y: GAP + TILE_H + GAP, w: TILE_W, h: TILE_H })
    expect(l.footer?.y).toBe(2 * TILE_H + 3 * GAP)
  })

  it('never makes more columns than tiles', () => {
    expect(listingLayout(2, 3, false).width).toBe(2 * TILE_W + 3 * GAP)
    expect(listingLayout(2, 3, false).footer).toBeNull()
  })
})

describe('coverCrop', () => {
  it('crops the sides of a wider image', () => {
    expect(coverCrop(2000, 1000, 300, 200)).toEqual({ x: 250, y: 0, w: 1500, h: 1000 })
  })
})

describe('listingCaption', () => {
  it('lists accounts, promos and the link', () => {
    const text = listingCaption(
      [account(), account({ level: 644, melee: 336, distance: 648, show_price: false })],
      { headline: 'Rucoy accounts for sale', link: 'https://leblancmid.vercel.app/', promos: ['SELL GOLD'] },
    )
    expect(text).toBe([
      'Rucoy accounts for sale',
      '',
      '• Lv 618 Melee — 700KK',
      '• Lv 644 Distance — DM for price',
      '',
      '✅ SELL GOLD',
      '',
      'More details: https://leblancmid.vercel.app/',
    ].join('\n'))
  })

  it('skips empty sections', () => {
    expect(listingCaption([account()], { headline: '', link: '', promos: [] })).toBe('• Lv 618 Melee — 700KK')
  })
})

describe('sameOriginPath', () => {
  it('keeps only the path of an absolute URL', () => {
    expect(sameOriginPath('http://localhost/storage/screenshots/a.png')).toBe('/storage/screenshots/a.png')
    expect(sameOriginPath('/storage/x.png')).toBe('/storage/x.png')
  })
})

describe('screenshotError', () => {
  it('accepts images up to 5 MB only', () => {
    expect(screenshotError({ type: 'image/png', size: 1_000_000 })).toBeNull()
    expect(screenshotError({ type: 'application/pdf', size: 10 })).toMatch(/PNG/)
    expect(screenshotError({ type: 'image/jpeg', size: 6 * 1024 * 1024 })).toMatch(/5 MB/)
  })
})
