import { describe, expect, it } from 'vitest'
import { locate, NAV_SECTIONS, visibleSections } from './navigation'

const where = (path: string) => {
  const { section, tab, title } = locate(path)
  return `${section.label} / ${tab.label} (${title})`
}

describe('navigation', () => {
  it('puts every page under its section and tab', () => {
    expect(where('/')).toBe('Daily Expenses / Dashboard (Dashboard)')
    expect(where('/transactions')).toBe('Daily Expenses / Transactions (Transactions)')
    expect(where('/budgets')).toBe('Daily Expenses / Budgets (Budgets)')
    expect(where('/master/balance')).toBe('Daily Expenses / Balance (Balance)')
    expect(where('/reports/daily-expenses')).toBe('Daily Expenses / Report (Report)')
    expect(where('/business')).toBe('Business / Stats (Stats)')
    expect(where('/business/transactions')).toBe('Business / Sales (Sales)')
    expect(where('/business/listing')).toBe('Business / Listing Kit (Listing Kit)')
    expect(where('/business/leads')).toBe('Business / Leads (Leads)')
    expect(where('/reports/business')).toBe('Business / Report (Report)')
    expect(where('/rucoy')).toBe('Rucoy / Summary (Summary)')
    expect(where('/rucoy/trades')).toBe('Rucoy / Trades (Trades)')
    expect(where('/rucoy/calculator')).toBe('Rucoy / Gold Calculator (Gold Calculator)')
    expect(where('/master')).toBe('Master File / Overview (Overview)')
    expect(where('/logs')).toBe('Master File / Logs (Logs)')
    expect(where('/master/undo')).toBe('Master File / Undo (Undo)')
  })

  it('shows Categories under the Budgets tab but keeps its own title', () => {
    expect(where('/categories')).toBe('Daily Expenses / Budgets (Categories)')
  })

  it('does not mark a section\'s first tab active on its other pages', () => {
    expect(locate('/master/balance').tab.label).not.toBe('Overview')
    expect(locate('/business/leads').tab.label).not.toBe('Stats')
  })

  it('falls back to the dashboard for unknown pages', () => {
    expect(where('/nope')).toBe('Daily Expenses / Dashboard (Dashboard)')
  })

  it('keeps every section at five tabs or fewer', () => {
    for (const s of NAV_SECTIONS) expect(s.tabs.length).toBeLessThanOrEqual(5)
  })

  it('shows daily-only users just Daily Expenses, without Balance', () => {
    const sections = visibleSections(false)
    expect(sections.map((s) => s.id)).toEqual(['daily'])
    expect(sections[0].tabs.map((t) => t.label)).toEqual(['Dashboard', 'Transactions', 'Budgets', 'Report'])
    expect(visibleSections(true)).toHaveLength(4)
  })
})
