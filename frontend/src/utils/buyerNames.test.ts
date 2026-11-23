import { describe, expect, it } from 'vitest'
import { buyerKey, didYouMean } from './buyerNames'

const known = ['DarkKnight', 'Mika', 'Pantay', 'Arrowz', 'Jeff']

describe('buyerKey', () => {
  it('ignores case, spaces and punctuation', () => {
    expect(buyerKey(' Dark Knight ')).toBe('darkknight')
    expect(buyerKey('Dark.Knight')).toBe('darkknight')
    expect(buyerKey('ñiño_07')).toBe('ñiño07')
  })
})

describe('didYouMean', () => {
  it('finds a buyer written differently', () => {
    expect(didYouMean('dark knight', known)).toBe('DarkKnight')
    expect(didYouMean('DARK.KNIGHT', known)).toBe('DarkKnight')
  })

  it('catches small typos, more on longer names', () => {
    expect(didYouMean('Pantey', known)).toBe('Pantay')      // 1 off
    expect(didYouMean('DarkKnigth', known)).toBe('DarkKnight') // 2 off, long name
    expect(didYouMean('Paxtey', known)).toBeNull()           // 2 off, short name: a different person
  })

  it('says nothing for an exact name, a new buyer, or very short input', () => {
    expect(didYouMean('Mika', known)).toBeNull()
    expect(didYouMean('Zoltan', known)).toBeNull()
    expect(didYouMean('Je', known)).toBeNull()
  })
})
