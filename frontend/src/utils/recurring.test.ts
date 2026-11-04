import { describe, expect, it } from 'vitest'
import { describeRepeat } from './recurring'

describe('describeRepeat', () => {
  it('says when it repeats', () => {
    expect(describeRepeat('daily', '2026-11-05')).toBe('Every day.')
    expect(describeRepeat('weekly', '2026-11-05')).toBe('Every Thursday.')
    expect(describeRepeat('monthly', '2026-11-01')).toBe('Every month on the 1st.')
    expect(describeRepeat('monthly', '2026-11-22')).toBe('Every month on the 22nd.')
    expect(describeRepeat('monthly', '2026-11-13')).toBe('Every month on the 13th.')
  })

  it('explains the end-of-month rule', () => {
    expect(describeRepeat('monthly', '2026-01-31')).toBe('Every month on the 31st (the last day in shorter months).')
  })

  it('asks for a date when there is none', () => {
    expect(describeRepeat('monthly', '')).toBe('Pick the first date.')
  })
})
