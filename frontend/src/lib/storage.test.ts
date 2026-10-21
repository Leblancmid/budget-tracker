import { afterEach, describe, expect, it, vi } from 'vitest'
import { readJson, readNumber, readString, STORAGE_KEYS, writeString } from './storage'

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() { return data.size },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => { data.delete(k) },
    setItem: (k, v) => { data.set(k, String(v)) },
  }
}

afterEach(() => { vi.unstubAllGlobals() })

describe('storage', () => {
  it('reads back what was written', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    writeString(STORAGE_KEYS.theme, 'dark')
    expect(readString(STORAGE_KEYS.theme)).toBe('dark')
  })

  it('falls back for missing, zero or invalid numbers', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    expect(readNumber(STORAGE_KEYS.masterPhpRate, 61)).toBe(61)
    writeString(STORAGE_KEYS.masterPhpRate, '0')
    expect(readNumber(STORAGE_KEYS.masterPhpRate, 61)).toBe(61)
    writeString(STORAGE_KEYS.masterPhpRate, '58.5')
    expect(readNumber(STORAGE_KEYS.masterPhpRate, 61)).toBe(58.5)
  })

  it('survives corrupt JSON', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    writeString(STORAGE_KEYS.authUser, '{not json')
    expect(readJson(STORAGE_KEYS.authUser, null)).toBeNull()
  })

  it('never throws when storage is unavailable', () => {
    const blocked = () => { throw new Error('SecurityError') }
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked })
    expect(readString(STORAGE_KEYS.theme)).toBeNull()
    expect(() => writeString(STORAGE_KEYS.theme, 'dark')).not.toThrow()
    expect(readNumber(STORAGE_KEYS.balancePhpRate, 58)).toBe(58)
  })
})
