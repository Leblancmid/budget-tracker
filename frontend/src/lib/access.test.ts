import { describe, expect, it } from 'vitest'
import { can, extraModules, isAdmin, isCustom, modulesOf } from './access'

describe('access', () => {
  it('gives each role its preset', () => {
    expect(modulesOf({ role: 'admin' })).toEqual(['daily', 'trading', 'wallets', 'master'])
    expect(modulesOf({ role: 'trader' })).toEqual(['daily', 'trading'])
    expect(modulesOf({ role: 'daily_only' })).toEqual(['daily'])
    expect(modulesOf(null)).toEqual([])
  })

  it('uses the modules picked for a person, except for admins who always have everything', () => {
    expect(can({ role: 'trader', modules: ['daily', 'trading', 'wallets'] }, 'wallets')).toBe(true)
    expect(can({ role: 'admin', modules: ['daily'] }, 'master')).toBe(true)
    expect(can({ role: 'daily_only' }, 'trading')).toBe(false)
  })

  it('says when someone has more or less than their role gives', () => {
    expect(isCustom({ role: 'trader', modules: ['daily', 'trading'] })).toBe(false)
    expect(isCustom({ role: 'trader', modules: ['daily', 'trading', 'wallets'] })).toBe(true)
    expect(isCustom({ role: 'admin', modules: ['daily'] })).toBe(false)
    expect(extraModules({ role: 'trader', modules: ['daily', 'trading', 'wallets'] })).toBe('Trading, Wallets')
    expect(extraModules({ role: 'daily_only' })).toBe('')
  })

  it('knows admins', () => {
    expect(isAdmin({ role: 'admin' })).toBe(true)
    expect(isAdmin({ role: 'trader' })).toBe(false)
    expect(isAdmin(null)).toBe(false)
  })
})
