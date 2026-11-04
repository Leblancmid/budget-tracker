import { describe, expect, it } from 'vitest'
import { mondayOf } from './briefSeen'

describe('mondayOf', () => {
  it('gives the Monday that starts the week', () => {
    expect(mondayOf('2026-11-02')).toBe('2026-11-02') // Monday
    expect(mondayOf('2026-11-05')).toBe('2026-11-02') // Thursday
    expect(mondayOf('2026-11-08')).toBe('2026-11-02') // Sunday still belongs to that week
    expect(mondayOf('2026-11-09')).toBe('2026-11-09')
  })

  it('crosses months and years', () => {
    expect(mondayOf('2026-03-01')).toBe('2026-02-23')
    expect(mondayOf('2027-01-01')).toBe('2026-12-28')
  })
})
