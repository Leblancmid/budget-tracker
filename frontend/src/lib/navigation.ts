import { Briefcase, FolderOpen, Gamepad2, Wallet, type LucideIcon } from 'lucide-react'

/**
 * The app's navigation in one place: the sidebar lists the sections, the tab bar under the header
 * lists the current section's tabs, and the header shows "Section / Tab". Page URLs never change.
 */

export type SectionId = 'daily' | 'business' | 'rucoy' | 'master'

export interface NavTab {
  to: string
  label: string
  /** Only this exact URL makes the tab active (for a section's first page) */
  end?: boolean
  /** Hidden from daily-only users */
  adminOnly?: boolean
  /** Other pages that belong under this tab (e.g. Categories is managed from Budgets) */
  alsoActiveOn?: { path: string; title: string }[]
}

export interface NavSection {
  id: SectionId
  label: string
  icon: LucideIcon
  adminOnly?: boolean
  tabs: NavTab[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'daily',
    label: 'Daily Expenses',
    icon: Wallet,
    tabs: [
      { to: '/', label: 'Dashboard', end: true },
      { to: '/transactions', label: 'Transactions' },
      { to: '/budgets', label: 'Budgets', alsoActiveOn: [{ path: '/categories', title: 'Categories' }] },
      { to: '/master/balance', label: 'Balance', adminOnly: true },
      { to: '/reports/daily-expenses', label: 'Report' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: Briefcase,
    adminOnly: true,
    tabs: [
      { to: '/business', label: 'Stats', end: true },
      { to: '/business/transactions', label: 'Sales' },
      { to: '/business/listing', label: 'Listing Kit' },
      { to: '/business/leads', label: 'Leads' },
      { to: '/reports/business', label: 'Report' },
    ],
  },
  {
    id: 'rucoy',
    label: 'Rucoy',
    icon: Gamepad2,
    adminOnly: true,
    tabs: [
      { to: '/rucoy', label: 'Summary', end: true },
      { to: '/rucoy/trades', label: 'Trades' },
      { to: '/rucoy/calculator', label: 'Gold Calculator' },
    ],
  },
  {
    id: 'master',
    label: 'Master File',
    icon: FolderOpen,
    adminOnly: true,
    tabs: [
      { to: '/master', label: 'Overview', end: true },
      { to: '/logs', label: 'Logs' },
    ],
  },
]

const under = (pathname: string, path: string) => pathname === path || pathname.startsWith(path + '/')

/** Does this tab own the URL? */
export function tabMatches(tab: NavTab, pathname: string): boolean {
  if (tab.end ? pathname === tab.to : under(pathname, tab.to)) return true
  return (tab.alsoActiveOn ?? []).some((p) => under(pathname, p.path))
}

/** The section and tab a URL belongs to. The most specific tab wins (e.g. /master/balance → Balance, not Overview). */
export function locate(pathname: string): { section: NavSection; tab: NavTab; title: string } {
  let best: { section: NavSection; tab: NavTab; length: number } | null = null
  for (const section of NAV_SECTIONS) {
    for (const tab of section.tabs) {
      if (!tabMatches(tab, pathname)) continue
      const length = Math.max(tab.to.length, ...(tab.alsoActiveOn ?? []).filter((p) => under(pathname, p.path)).map((p) => p.path.length))
      if (!best || length > best.length) best = { section, tab, length }
    }
  }
  const section = best?.section ?? NAV_SECTIONS[0]
  const tab = best?.tab ?? section.tabs[0]
  // A page shown under another tab keeps its own name in the title (Categories, not Budgets)
  const extra = (tab.alsoActiveOn ?? []).find((p) => under(pathname, p.path))
  return { section, tab, title: extra?.title ?? tab.label }
}

/** Sections and tabs this user may see. */
export function visibleSections(isAdmin: boolean): NavSection[] {
  if (isAdmin) return NAV_SECTIONS
  return NAV_SECTIONS.filter((s) => !s.adminOnly).map((s) => ({ ...s, tabs: s.tabs.filter((t) => !t.adminOnly) }))
}

/** Colours per section (sidebar icon, header badge, active tab underline). */
export const SECTION_STYLES: Record<SectionId, { icon: string; iconBg: string; badge: string; tabActive: string }> = {
  daily: {
    icon: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    tabActive: 'border-indigo-500 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300',
  },
  business: {
    icon: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    tabActive: 'border-teal-500 text-teal-700 dark:border-teal-400 dark:text-teal-300',
  },
  rucoy: {
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    tabActive: 'border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300',
  },
  master: {
    icon: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    tabActive: 'border-violet-500 text-violet-700 dark:border-violet-400 dark:text-violet-300',
  },
}
