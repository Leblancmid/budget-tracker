import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, loadSession, rememberedEmail, saveSession, sessionToken, setRememberedEmail, type AuthSession } from './authSession'

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

const NOW = Date.parse('2026-10-26T10:00:00Z')
const session = (expiresAt = '2026-10-26T22:00:00Z'): AuthSession => ({
  token: '1|budget_abc',
  user: { id: 1, name: 'Mikey', email: 'mikey@example.com', role: 'admin' },
  expiresAt,
})

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
  vi.stubGlobal('sessionStorage', memoryStorage())
})
afterEach(() => { vi.unstubAllGlobals() })

describe('auth session storage', () => {
  it('keeps a remembered login in localStorage', () => {
    saveSession(session(), true)
    expect(localStorage.getItem('auth_token')).toBe('1|budget_abc')
    expect(sessionStorage.getItem('auth_token')).toBeNull()
    expect(loadSession(NOW)).toEqual(session())
  })

  it('keeps other logins in sessionStorage only (gone when the browser closes)', () => {
    saveSession(session(), false)
    expect(sessionStorage.getItem('auth_token')).toBe('1|budget_abc')
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(sessionToken()).toBe('1|budget_abc')
  })

  it('replaces a login saved in the other storage', () => {
    saveSession(session(), true)
    saveSession({ ...session(), token: '2|budget_new' }, false)
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(sessionToken()).toBe('2|budget_new')
  })

  it('drops an expired login when loading', () => {
    saveSession(session('2026-10-26T09:59:59Z'), true)
    expect(loadSession(NOW)).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('drops a login whose saved user is corrupt', () => {
    saveSession(session(), true)
    localStorage.setItem('auth_user', '{broken')
    expect(loadSession(NOW)).toBeNull()
    expect(sessionToken()).toBeNull()
  })

  it('still loads logins saved before expiry was tracked', () => {
    localStorage.setItem('auth_token', '1|old')
    localStorage.setItem('auth_user', JSON.stringify(session().user))
    expect(loadSession(NOW)).toMatchObject({ token: '1|old', expiresAt: '' })
  })

  it('clears everything on sign-out', () => {
    saveSession(session(), true)
    clearSession()
    expect(loadSession(NOW)).toBeNull()
    expect(localStorage.length + sessionStorage.length).toBe(0)
  })

  it('remembers the email only when asked', () => {
    setRememberedEmail('mikey@example.com')
    expect(rememberedEmail()).toBe('mikey@example.com')
    setRememberedEmail(null)
    expect(rememberedEmail()).toBe('')
  })

  it('treats blocked storage as signed out instead of crashing', () => {
    const blocked = () => { throw new Error('SecurityError') }
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked })
    vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked, removeItem: blocked })
    expect(() => saveSession(session(), true)).not.toThrow()
    expect(loadSession(NOW)).toBeNull()
  })
})
