import { describe, expect, it } from 'vitest'
import { locate, NAV_SECTIONS, visibleSections } from './navigation'
import { can, isAdmin } from './access'

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
    expect(where('/business/listing')).toBe('Storefront / Listing Kit (Listing Kit)')
    expect(where('/business/leads')).toBe('Storefront / Leads (Leads)')
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

  const forUser = (user: Parameters<typeof can>[0]) => visibleSections({ can: (m) => can(user, m), admin: isAdmin(user) })

  it('shows daily-only users just Daily Expenses (without Balance) and their profile', () => {
    const sections = forUser({ role: 'daily_only' })
    expect(sections.map((s) => s.id)).toEqual(['daily', 'account'])
    expect(sections[0].tabs.map((t) => t.label)).toEqual(['Dashboard', 'Transactions', 'Budgets', 'Report'])
    expect(sections[1].tabs.map((t) => t.label)).toEqual(['Profile'])
  })

  it('shows traders Business and Rucoy but not wallets, the Master File or users', () => {
    const sections = forUser({ role: 'trader' })
    expect(sections.map((s) => s.id)).toEqual(['daily', 'business', 'storefront', 'rucoy', 'account'])
    expect(sections[0].tabs.map((t) => t.label)).not.toContain('Balance')
    expect(sections.at(-1)?.tabs.map((t) => t.label)).toEqual(['Profile'])
    expect(sections[1].tabs.map((t) => t.label)).toEqual(['Stats', 'Sales', 'Report'])
    expect(sections[2].tabs.map((t) => t.label)).toEqual(['Listing Kit', 'Leads'])
  })

  it('hides the Storefront (Listing Kit and Leads) from a trader without it', () => {
    expect(forUser({ role: 'trader', modules: ['daily', 'trading'] }).map((s) => s.id)).toEqual(['daily', 'business', 'rucoy', 'account'])
  })

  it('puts the Listing Kit and Leads under Storefront', () => {
    expect(locate('/business/listing')).toMatchObject({ title: 'Listing Kit', section: { id: 'storefront' } })
    expect(locate('/business/leads')).toMatchObject({ title: 'Leads', section: { id: 'storefront' } })
    expect(locate('/business')).toMatchObject({ title: 'Stats', section: { id: 'business' } })
  })

  it('follows the modules picked for a person, and shows admins everything', () => {
    const custom = forUser({ role: 'daily_only', modules: ['daily', 'wallets', 'master'] })
    expect(custom.map((s) => s.id)).toEqual(['daily', 'master', 'account'])
    expect(custom[0].tabs.map((t) => t.label)).toContain('Balance')
    const admin = forUser({ role: 'admin' })
    expect(admin).toHaveLength(6)
    expect(admin.at(-1)?.tabs.map((t) => t.label)).toEqual(['Profile', 'Users'])
  })

  it('puts Profile and Users under Account', () => {
    expect(locate('/profile')).toMatchObject({ title: 'Profile', section: { id: 'account' } })
    expect(locate('/users')).toMatchObject({ title: 'Users', section: { id: 'account' } })
  })
})
