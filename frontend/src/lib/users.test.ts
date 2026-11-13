import { describe, expect, it } from 'vitest'
import { avatarGradient, deviceName, generatePassword, initials, passwordChecks, passwordOk, passwordStrength, roleLabel, timeAgo, userStatus } from './users'

const NOW = Date.parse('2026-11-13T10:00:00+08:00')
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString()

describe('initials', () => {
  it('takes the first and last name', () => {
    expect(initials('Michael Adriane Nabong')).toBe('MN')
    expect(initials('  ben ')).toBe('B')
    expect(initials('')).toBe('?')
  })
})

describe('avatarGradient', () => {
  it('is the same for the same person and never out of range', () => {
    expect(avatarGradient(7)).toBe(avatarGradient(7))
    expect(avatarGradient(-3)).toBeTruthy()
  })
})

describe('timeAgo and userStatus', () => {
  it('says how long ago in plain words', () => {
    expect(timeAgo(ago(0), NOW)).toBe('just now')
    expect(timeAgo(ago(5), NOW)).toBe('5 min ago')
    expect(timeAgo(ago(180), NOW)).toBe('3 h ago')
    expect(timeAgo(ago(60 * 30), NOW)).toBe('yesterday')
    expect(timeAgo(ago(60 * 24 * 4), NOW)).toBe('4 days ago')
    expect(timeAgo(null, NOW)).toBeNull()
  })

  it('gives one sentence per account', () => {
    expect(userStatus({ deactivated_at: ago(1), last_active_at: ago(2) }, NOW)).toEqual({ text: 'Deactivated · can\'t sign in', tone: 'off' })
    expect(userStatus({ deactivated_at: null, last_active_at: null }, NOW)).toEqual({ text: 'Never signed in', tone: 'idle' })
    expect(userStatus({ deactivated_at: null, last_active_at: ago(5), must_change_password: true }, NOW)).toEqual({ text: 'Has to choose a new password', tone: 'idle' })
    expect(userStatus({ deactivated_at: null, last_active_at: ago(5) }, NOW)).toEqual({ text: 'Active · seen 5 min ago', tone: 'active' })
  })
})

describe('deviceName', () => {
  it('names common browsers and systems', () => {
    expect(deviceName('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36')).toBe('Chrome on Windows')
    expect(deviceName('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')).toBe('Safari on iPhone')
    expect(deviceName('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0')).toBe('Edge on Windows')
    expect(deviceName('api')).toBe('api')
    expect(deviceName('')).toBe('Unknown device')
  })
})

describe('passwords', () => {
  it('checks the same rules as the server', () => {
    expect(passwordOk('Strong-pass-1')).toBe(true)
    expect(passwordOk('short1A')).toBe(false)
    expect(passwordOk('alllowercase123')).toBe(false)
    expect(passwordChecks('abcdefghij').map((c) => c.ok)).toEqual([true, false, false])
  })

  it('rates strength from 0 to 4', () => {
    expect(passwordStrength('')).toBe(0)
    expect(passwordStrength('abc')).toBe(0)
    expect(passwordStrength('abcdefghij')).toBe(1)
    expect(passwordStrength('Abcdefghij1')).toBe(3)
    expect(passwordStrength('Abcdefghij1!')).toBe(4)
  })

  it('generates passwords that always pass', () => {
    for (let i = 0; i < 50; i++) expect(passwordOk(generatePassword())).toBe(true)
    expect(generatePassword(16)).toHaveLength(16)
  })
})

describe('roleLabel', () => {
  it('names each role', () => {
    expect(roleLabel('admin')).toBe('Admin')
    expect(roleLabel('daily_only')).toBe('Daily Expenses only')
  })
})
