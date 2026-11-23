import { describe, expect, it } from 'vitest'
import type { PriceGuide } from '@/types'
import { checkBuy } from './buyCheck'
import { parseQuickAdd, type QuickAddContext } from './quickAdd'

const guide = {
  price_php: 4200, max_buy_php: 3150, price_gold: 2_000_000_000, max_buy_gold: 1_500_000_000,
} as PriceGuide['account']

describe('checkBuy', () => {
  it('judges a ₱ price against the guide', () => {
    expect(checkBuy(guide, 3000, null)).toMatchObject({ verdict: 'good', profit: 1200, unit: 'php' })
    expect(checkBuy(guide, 3800, null)).toMatchObject({ verdict: 'tight', profit: 400 })
    expect(checkBuy(guide, 4500, null)).toMatchObject({ verdict: 'bad', profit: -300 })
  })

  it('judges a gold price in gold', () => {
    expect(checkBuy(guide, null, 1_200_000_000)).toMatchObject({ verdict: 'good', profit: 800_000_000, unit: 'gold' })
  })

  it('aims for a 20% margin when your usual margin is not known yet', () => {
    const noMargin = { ...guide, max_buy_php: null, usual_margin: null }
    expect(checkBuy(noMargin, 3000, null)).toMatchObject({ verdict: 'good', maxBuy: 3360, margin: 20, assumedMargin: true })
    expect(checkBuy(noMargin, 3800, null)).toMatchObject({ verdict: 'tight' })
    expect(checkBuy({ ...guide, usual_margin: 25 }, 3000, null)).toMatchObject({ margin: 25, assumedMargin: false })
  })

  it("can't judge without a price or similar sales", () => {
    expect(checkBuy(guide, null, null).verdict).toBe('unknown')
    expect(checkBuy({ ...guide, price_php: null }, 3000, null).verdict).toBe('unknown')
  })
})

describe('parseQuickAdd: buy check', () => {
  const ctx = { today: '2026-11-23', access: { trading: true, wallets: true }, history: [], wallets: [], categories: [] } as QuickAddContext

  it('reads the level, build and asking price', () => {
    expect(parseQuickAdd('check 650 melee 3500', ctx)).toEqual({ kind: 'buycheck', level: 650, build: 'melee', askPhp: 3500, askGold: null })
    expect(parseQuickAdd('check lv 620 dist 1.2kkk', ctx)).toEqual({ kind: 'buycheck', level: 620, build: 'distance', askPhp: null, askGold: 1_200_000_000 })
    expect(parseQuickAdd('worth lv700 mage ₱6k', ctx)).toEqual({ kind: 'buycheck', level: 700, build: 'magic', askPhp: 6000, askGold: null })
    expect(parseQuickAdd('check 650 melee', ctx)).toMatchObject({ kind: 'buycheck', askPhp: null, askGold: null })
  })

  it('asks for what is missing', () => {
    expect(parseQuickAdd('check melee 3500', ctx)).toMatchObject({ kind: 'error' })
    expect(parseQuickAdd('check 650 3500', ctx)).toMatchObject({ kind: 'error', message: expect.stringContaining('build') })
    expect(parseQuickAdd('check 650 melee', { ...ctx, access: { trading: false, wallets: true } })).toMatchObject({ kind: 'error' })
  })
})
