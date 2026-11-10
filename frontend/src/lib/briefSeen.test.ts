import { afterEach, describe, expect, it, vi } from 'vitest'
import { markBriefSeen, mondayOf } from './briefSeen'
import { readString, STORAGE_KEYS } from './storage'

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

describe('markBriefSeen', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('keeps the Business and Daily Expenses briefs apart', () => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => { data.set(k, String(v)) },
      removeItem: (k: string) => { data.delete(k) },
    })
    const dispatchEvent = vi.fn()
    vi.stubGlobal('window', { dispatchEvent })

    markBriefSeen('2026-11-09', 'daily')
    expect(readString(STORAGE_KEYS.briefSeenWeekDaily)).toBe('2026-11-09')
    expect(readString(STORAGE_KEYS.briefSeenWeek)).toBeNull() // the Business dot stays

    markBriefSeen('2026-11-09') // Business is the default
    expect(readString(STORAGE_KEYS.briefSeenWeek)).toBe('2026-11-09')

    markBriefSeen('2026-11-09', 'daily') // already seen: no event
    expect(dispatchEvent).toHaveBeenCalledTimes(2)
  })
})
