import { describe, expect, it } from 'vitest'
import { parseGold, parseMoney, parseQuickAdd, type QuickAddContext } from './quickAdd'

const ctx: QuickAddContext = {
  today: '2026-11-05',
  access: { trading: true, wallets: true },
  wallets: [
    { code: 'GCASH', name: 'GCash', currency: 'PHP' },
    { code: 'MAYA', name: 'Maya', currency: 'PHP' },
    { code: 'MARIBANK', name: 'Maribank', currency: 'PHP' },
    { code: 'PAYPAL', name: 'PayPal', currency: 'USD' },
  ],
  categories: [
    { id: 1, name: 'Food', type: 'expense' },
    { id: 2, name: 'Transport', type: 'expense' },
    { id: 3, name: 'Salary', type: 'income' },
  ],
  history: [
    { description: 'Lunch', category_id: 1, type: 'expense' },
    { description: 'Grab to office', category_id: 2, type: 'expense' },
  ],
}

describe('amount parsing', () => {
  it('reads gold the way trades are quoted', () => {
    expect(parseGold('500M')).toBe(500_000_000)
    expect(parseGold('500kk')).toBe(500_000_000)
    expect(parseGold('1.8B')).toBe(1_800_000_000)
    expect(parseGold('1.8kkk')).toBe(1_800_000_000)
    expect(parseGold('250')).toBeNull()
  })

  it('reads pesos with or without the sign', () => {
    expect(parseMoney('250')).toBe(250)
    expect(parseMoney('1,500')).toBe(1500)
    expect(parseMoney('5k')).toBe(5000)
    expect(parseMoney('₱99.50')).toBe(99.5)
    expect(parseMoney('lunch')).toBeNull()
  })
})

describe('parseQuickAdd', () => {
  it('makes an expense, learning the category from past entries', () => {
    expect(parseQuickAdd('250 lunch gcash', ctx)).toEqual({
      kind: 'daily', type: 'expense', amount: 250, description: 'Lunch', categoryId: 1, wallet: 'GCASH', business: false, date: '2026-11-05',
    })
    expect(parseQuickAdd('180 grab', ctx)).toMatchObject({ categoryId: 2, description: 'Grab' })
  })

  it('uses a category named in the text', () => {
    expect(parseQuickAdd('120 transport jeep', ctx)).toMatchObject({ categoryId: 2, description: 'Jeep' })
  })

  it('makes income from + or an income word', () => {
    expect(parseQuickAdd('+15k salary maya', ctx)).toMatchObject({ type: 'income', amount: 15000, categoryId: 3, wallet: 'MAYA' })
    expect(parseQuickAdd('15000 salary', ctx)).toMatchObject({ type: 'income', categoryId: 3 })
  })

  it('understands yesterday and business', () => {
    expect(parseQuickAdd('300 snacks yesterday biz', ctx)).toMatchObject({ date: '2026-11-04', business: true, categoryId: null, description: 'Snacks' })
  })

  it('makes a transfer from two accounts', () => {
    expect(parseQuickAdd('5000 maribank > gcash fee 15', ctx)).toEqual({
      kind: 'transfer', amount: 5000, from: 'MARIBANK', to: 'GCASH', fee: 15, date: '2026-11-05', note: null,
    })
    expect(parseQuickAdd('transfer 2k mari to maya', ctx)).toMatchObject({ kind: 'transfer', amount: 2000, from: 'MARIBANK', to: 'MAYA' })
    expect(parseQuickAdd('100 paypal > gcash', ctx)).toMatchObject({ kind: 'error' })
  })

  it('makes a gold trade with rates', () => {
    expect(parseQuickAdd('gold 500M @.17 sell .19 gcash', ctx)).toEqual({
      kind: 'gold', gold: 500_000_000, costRate: 0.17, sellRate: 0.19, phpPaid: null, wallet: 'GCASH', description: '', date: '2026-11-05',
    })
    expect(parseQuickAdd('500kk @.17/.19 kai', ctx)).toMatchObject({ kind: 'gold', costRate: 0.17, sellRate: 0.19, description: 'Kai' })
  })

  it('takes the ₱ paid for gold', () => {
    expect(parseQuickAdd('gold 500M @.17 ₱5400 maya', ctx)).toMatchObject({ kind: 'gold', phpPaid: 5400, wallet: 'MAYA' })
    expect(parseQuickAdd('gold 500M @.17 5400', ctx)).toMatchObject({ kind: 'gold', phpPaid: 5400 })
  })

  it('explains what is missing', () => {
    expect(parseQuickAdd('lunch gcash', ctx)).toMatchObject({ kind: 'error' })
    expect(parseQuickAdd('   ', ctx)).toEqual({ kind: 'empty' })
    expect(parseQuickAdd('10 paypal', ctx)).toMatchObject({ kind: 'error' })
  })

  it('keeps daily-only users to daily entries', () => {
    const daily = { ...ctx, access: { trading: false, wallets: false } }
    expect(parseQuickAdd('gold 500M @.17', daily)).toMatchObject({ kind: 'error' })
    expect(parseQuickAdd('250 lunch gcash biz', daily)).toMatchObject({ kind: 'daily', wallet: null, business: false })
  })
})
