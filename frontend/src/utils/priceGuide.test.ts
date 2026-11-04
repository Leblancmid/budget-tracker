import { describe, expect, it } from 'vitest'
import { formatGoldShort, guessLevelAndClass } from './priceGuide'

describe('formatGoldShort', () => {
  it('uses trade-chat units', () => {
    expect(formatGoldShort(1_500_000_000)).toBe('1.5KKK')
    expect(formatGoldShort(2_430_000_000)).toBe('2.43KKK')
    expect(formatGoldShort(540_000_000)).toBe('540KK')
    expect(formatGoldShort(813_000_000)).toBe('813KK')
    expect(formatGoldShort(961_500_000)).toBe('961.5KK')
  })
})

describe('guessLevelAndClass', () => {
  it('reads the name when the stats are empty', () => {
    expect(guessLevelAndClass('Leblanc 640 Dist', {})).toEqual({ level: 640, accountClass: 'distance' })
    expect(guessLevelAndClass('Leblanc 641 Magic', {})).toEqual({ level: 641, accountClass: 'magic' })
    expect(guessLevelAndClass('Leblanc 632 Melee', {})).toEqual({ level: 632, accountClass: 'melee' })
  })

  it('prefers the stats screen', () => {
    expect(guessLevelAndClass('Leblanc 640 Dist', { level: '655', melee: '50', distance: '120', magic: '10' }))
      .toEqual({ level: 655, accountClass: 'distance' })
    expect(guessLevelAndClass('Some account', { level: '500', magic: '130' })).toEqual({ level: 500, accountClass: 'magic' })
  })

  it('gives nothing when it cannot tell', () => {
    expect(guessLevelAndClass('', {})).toEqual({ level: null, accountClass: null })
  })
})
