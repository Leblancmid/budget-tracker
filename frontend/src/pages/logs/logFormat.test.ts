import { describe, expect, it } from 'vitest'
import type { LogEntry } from '@/api/logs'
import { detectDevice, eventOf, fieldMeta, formatAmount, formatValue, isPositiveEntry, summarizeLogs } from './logFormat'

const entry = (overrides: Partial<LogEntry>) => ({
  module: 'daily', type: 'income', description: null, amount: null, date: null, created_at: '2026-10-21T02:00:00Z',
  ip_address: null, user_agent: null, user_id: null, user_name: null, user_email: null, ...overrides,
}) as LogEntry

describe('log formatting', () => {
  it('formats values by kind', () => {
    expect(formatValue('1200000.4', 'gold')).toBe('1,200,000 G')
    expect(formatValue(1234.5, 'php')).toBe('₱1,234.50')
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
