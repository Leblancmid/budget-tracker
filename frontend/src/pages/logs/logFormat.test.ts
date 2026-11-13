import { describe, expect, it } from 'vitest'
import type { LogEntry } from '@/api/logs'
import { detectDevice, eventOf, fieldMeta, formatAmount, formatValue, isAbout, isDeniedAccess, isPositiveEntry, summarizeLogs } from './logFormat'

const entry = (overrides: Partial<LogEntry>) => ({
  module: 'daily', type: 'income', description: null, amount: null, date: null, created_at: '2026-10-21T02:00:00Z',
  ip_address: null, user_agent: null, user_id: null, user_name: null, user_email: null, ...overrides,
}) as LogEntry

describe('sign-ins, undo and added records', () => {
  it('files each under its event filter', () => {
    expect(eventOf(entry({ module: 'access', type: 'signed_in' }))).toBe('access')
    expect(eventOf(entry({ module: 'access', type: 'sign_in_failed' }))).toBe('access')
    expect(eventOf(entry({ module: 'system', type: 'undone' }))).toBe('edited')
    expect(eventOf(entry({ type: 'added' }))).toBe('created')
  })

  it('flags sign-ins that didn\'t get through', () => {
    expect(isDeniedAccess(entry({ module: 'access', type: 'sign_in_failed' }))).toBe(true)
    expect(isDeniedAccess(entry({ module: 'access', type: 'locked_out' }))).toBe(true)
    expect(isDeniedAccess(entry({ module: 'access', type: 'signed_in' }))).toBe(false)
  })

  it('lists a failed sign-in with someone\'s email under that person, without saying they did it', () => {
    const failed = entry({ module: 'access', type: 'sign_in_failed', user_id: null, about_user_id: 1 })
    expect(isAbout(failed, 1)).toBe(true)
    expect(isAbout(failed, 2)).toBe(false)
    expect(isAbout(entry({ user_id: 2, about_user_id: 1 }), 1)).toBe(false)
  })

  it('shows an added record\'s amount (a budget) as neither income nor expense', () => {
    expect(isPositiveEntry(entry({ type: 'added', amount: '5000' }))).toBe(true)
  })
})

describe('log formatting', () => {
  it('formats values by kind', () => {
    expect(formatValue('1200000.4', 'gold')).toBe('1,200,000 G')
    expect(formatValue(1234.5, 'php')).toBe('₱1,234.50')
    expect(formatValue(['daily', 'trading'], 'text')).toBe('Daily, Trading')
    expect(formatValue([], 'text')).toBe('—')
    expect(formatValue('["daily","master"]', 'text')).toBe('Daily, Master')
    expect(formatValue('12.5', 'usd')).toBe('$12.50')
    expect(formatValue('0.123456', 'rate')).toBe('0.1235')
    expect(formatValue('2026-10-01', 'date')).toBe('Oct 1, 2026')
    expect(formatValue(null, 'php')).toBe('—')
  })

  it('labels fields, using the account currency for balance amounts', () => {
    expect(fieldMeta('price_gold', entry({}))).toEqual({ label: 'Price (G)', kind: 'gold' })
    expect(fieldMeta('amount', entry({ module: 'balance', currency: 'PHP' })).kind).toBe('php')
    expect(fieldMeta('amount', entry({ module: 'balance', currency: 'USD' })).kind).toBe('usd')
    expect(fieldMeta('some_field', entry({})).label).toBe('Some Field')
  })

  it('signs entries by what they do to the money', () => {
    expect(isPositiveEntry(entry({ module: 'daily', type: 'expense' }))).toBe(false)
    expect(isPositiveEntry(entry({ module: 'gold', type: 'fee' }))).toBe(true)
    expect(isPositiveEntry(entry({ module: 'business', amount: '-5' }))).toBe(false)
    expect(formatAmount(entry({ module: 'gold', amount: '-300' }))).toBe('300 G')
  })

  it('classifies events and devices', () => {
    expect(eventOf(entry({ type: 'edited' }))).toBe('edited')
    expect(eventOf(entry({ type: 'archived' }))).toBe('archived')
    expect(eventOf(entry({ type: 'sell' }))).toBe('created')
    expect(eventOf(entry({ type: 'payment' }))).toBe('created')
    expect(eventOf(entry({ type: 'removed' }))).toBe('removed')
    expect(detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe('mobile')
    expect(detectDevice('Mozilla/5.0 (Windows NT 10.0)')).toBe('desktop')
    expect(detectDevice(null)).toBeNull()
  })

  it('summarizes edits and the busiest module', () => {
    const s = summarizeLogs([entry({ type: 'edited' }), entry({ module: 'gold' }), entry({ module: 'gold' })])
    expect(s.edits).toBe(1)
    expect(s.top).toEqual(['gold', 2])
    expect(s.days).toHaveLength(14)
  })
})
