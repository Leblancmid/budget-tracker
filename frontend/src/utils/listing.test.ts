import { describe, expect, it } from 'vitest'
import type { RucoyAccount } from '@/types'
import {
  accountBuild, coverCrop, cropRegion, daysListed, formatGoldShort, isNewListing, listingCaption,
  listingLayout, listingPrice, listingTitle, promoTiles, sameOriginPath, screenshotError, sortForListing, wrapText,
  DEFAULT_CROP, GAP, TILE_H, TILE_W,
} from './listing'

const account = (overrides: Partial<RucoyAccount> = {}) => ({
  id: 1, description: 'Acc', email: 'a@example.com', level: 618,
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
  it('lays tiles out in a grid', () => {
    const l = listingLayout(5, 3)
    expect(l.width).toBe(3 * TILE_W + 4 * GAP)
    expect(l.height).toBe(2 * TILE_H + 3 * GAP)
    expect(l.tiles[4]).toEqual({ x: GAP + TILE_W + GAP, y: GAP + TILE_H + GAP, w: TILE_W, h: TILE_H })
  })

  it('never makes more columns than tiles', () => {
    expect(listingLayout(2, 3).width).toBe(2 * TILE_W + 3 * GAP)
  })
})

describe('cropRegion', () => {
  it('cuts each edge by its percentage', () => {
    expect(cropRegion(1000, 500, { top: 20, right: 10, bottom: 0, left: 30 })).toEqual({ x: 300, y: 100, w: 600, h: 400 })
  })

  it('keeps the default to the stats panel (wider than tall, like the Canva tiles)', () => {
    const r = cropRegion(2400, 1080, DEFAULT_CROP)
    expect(r.w / r.h).toBeGreaterThan(1.4)
    expect(r.w / r.h).toBeLessThan(1.7)
  })

  it('never leaves an empty region', () => {
    const r = cropRegion(1000, 500, { top: 60, right: 60, bottom: 60, left: 60 })
    expect(r.w).toBeGreaterThan(0)
    expect(r.h).toBeGreaterThan(0)
    expect(r.x + r.w).toBeLessThanOrEqual(1000)
  })
})

describe('coverCrop', () => {
  it('fills the tile from the middle of the region', () => {
    expect(coverCrop({ x: 0, y: 0, w: 2000, h: 1000 }, 300, 200)).toEqual({ x: 250, y: 0, w: 1500, h: 1000 })
    expect(coverCrop({ x: 100, y: 50, w: 300, h: 200 }, 300, 200)).toEqual({ x: 100, y: 50, w: 300, h: 200 })
  })
})

describe('promoTiles', () => {
  const tile = (price = false, accessories = false) => ({ price, accessories })

  it('goes down the first column on tiles without a price, like the Canva layout', () => {
    // 3 columns; tiles 0 and 3 start each row, tile 1 has a price
    expect(promoTiles(2, 3, [tile(), tile(true), tile(), tile(), tile(), tile(true)])).toEqual([0, 3])
  })

  it('falls back to other free tiles, then priced ones', () => {
    expect(promoTiles(3, 3, [tile(true), tile(), tile()])).toEqual([1, 2, 0])
    expect(promoTiles(5, 3, [tile(), tile()])).toEqual([0, 1])
  })

  it('avoids tiles with accessories, which use the same corner', () => {
    expect(promoTiles(2, 3, [tile(false, true), tile(true), tile(), tile(false, true)])).toEqual([2, 1])
  })
})

describe('listingCaption accessories', () => {
  it('lists what comes with the account', () => {
    const text = listingCaption([account({ accessories: ['ring-green', 'crown'] })], { headline: '', link: '', promos: [] })
    expect(text).toBe('• Lv 618 Melee + Crown, Green ring — 700KK')
  })
})

describe('wrapText', () => {
  const measure = (s: string) => s.length * 10
  it('wraps on words to fit the width', () => {
    expect(wrapText('BUY 700 - 800 ACCOUNT', 140, measure)).toEqual(['BUY 700 - 800', 'ACCOUNT'])
    expect(wrapText('SELL GOLD', 140, measure)).toEqual(['SELL GOLD'])
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

describe('listingPrice', () => {
  it('shows gold deals in gold shorthand and cash deals in their currency', () => {
    expect(listingPrice(account({ deal_type: 'gold', price: 700_000_000 }))).toBe('700KK')
    expect(listingPrice(account({ deal_type: 'cash', price: null, price_cash: 8000, cash_currency: 'PHP' }))).toBe('₱8,000')
    expect(listingPrice(account({ deal_type: 'cash', price_cash: 150, cash_currency: 'USD' }))).toBe('$150')
    expect(listingPrice(account({ deal_type: 'cash', price_cash: null }))).toBeNull()
  })

  it('puts the cash price in the caption', () => {
    expect(listingCaption([account({ deal_type: 'cash', price_cash: 8000, cash_currency: 'PHP' })], { headline: '', link: '', promos: [] }))
      .toBe('• Lv 618 Melee — ₱8,000')
  })
})
