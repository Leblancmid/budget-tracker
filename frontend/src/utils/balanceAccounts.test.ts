import { describe, expect, it } from 'vitest'
import { creditUsed, dailyInterest, isCredit, owedOn, spendable } from './balanceAccounts'

describe('dailyInterest', () => {
  it('is balance × rate ÷ 365 after the withheld tax, like the server', () => {
    // ₱100,000 at 3.65% = ₱10 a day, minus 20% tax
    expect(dailyInterest(100_000, 3.65)).toBe(8)
    expect(dailyInterest(100_000, 3.65, 0)).toBe(10)
  })

  it('earns nothing without a rate or on a zero / negative balance', () => {
    expect(dailyInterest(100_000, null)).toBe(0)
    expect(dailyInterest(100_000, 0)).toBe(0)
    expect(dailyInterest(-500, 3.65)).toBe(0)
  })
})

const wallet = { kind: 'wallet' as const, credit_limit: null }
const card = { kind: 'credit' as const, credit_limit: 50000 }

describe('credit cards', () => {
  it('tells cards from wallets (wallet by default)', () => {
    expect(isCredit(card)).toBe(true)
    expect(isCredit(wallet)).toBe(false)
    expect(isCredit({})).toBe(false)
  })

  it('owes what is below zero, nothing when paid off', () => {
    expect(owedOn(-12000)).toBe(12000)
    expect(owedOn(0)).toBe(0)
    expect(owedOn(300)).toBe(0)
  })

  it('can still spend the limit minus what is owed; a wallet its balance', () => {
    expect(spendable(card, -12000)).toBe(38000)
    expect(spendable(card, -60000)).toBe(-10000)
    expect(spendable(wallet, 500)).toBe(500)
    expect(spendable({ kind: 'credit', credit_limit: null }, -100)).toBe(Infinity)
  })

  it('shows how much of the limit is used, capped at all of it', () => {
    expect(creditUsed(card, -12500)).toBe(0.25)
    expect(creditUsed(card, 100)).toBe(0)
    expect(creditUsed(card, -80000)).toBe(1)
    expect(creditUsed({ credit_limit: null }, -100)).toBe(0)
  })
})
