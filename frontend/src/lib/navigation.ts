import type { Module } from '@/context/auth'
import { Briefcase, CircleUserRound, FolderOpen, Gamepad2, Wallet, type LucideIcon } from 'lucide-react'

/**
 * The app's navigation in one place: the sidebar lists the sections, the tab bar under the header
 * lists the current section's tabs, and the header shows "Section / Tab". Page URLs never change.
 */

export type SectionId = 'daily' | 'business' | 'rucoy' | 'master' | 'account'

export interface NavTab {
  to: string
  label: string
  /** Only this exact URL makes the tab active (for a section's first page) */
  end?: boolean
  /** Shown only to people who can open this module */
  module?: Module
  /** Shown only to admins (user management) */
  adminOnly?: boolean
  /** Other pages that belong under this tab (e.g. Categories is managed from Budgets) */
  alsoActiveOn?: { path: string; title: string }[]
}

export interface NavSection {
  id: SectionId
  label: string
  /** One line under the label in the sidebar */
  caption: string
  /** Heading the section sits under in the sidebar */
  group: string
  icon: LucideIcon
  /** Shown only to people who can open this module */
  module?: Module
  /** Reached from the account menu and the sidebar's profile card, not a row of its own */
  hideInSidebar?: boolean
  tabs: NavTab[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'daily',
    group: 'Personal',
    caption: 'Expenses & budgets',
    label: 'Daily Expenses',
    icon: Wallet,
    tabs: [
      { to: '/', label: 'Dashboard', end: true },
      { to: '/transactions', label: 'Transactions' },
      { to: '/budgets', label: 'Budgets', alsoActiveOn: [{ path: '/categories', title: 'Categories' }] },
      { to: '/master/balance', label: 'Balance', module: 'wallets' },
      { to: '/reports/daily-expenses', label: 'Report' },
    ],
  },
  {
    id: 'business',
    group: 'Trading',
    caption: 'Sales, listings & leads',
    label: 'Business',
    icon: Briefcase,
    module: 'trading',
    tabs: [
      { to: '/business', label: 'Stats', end: true },
      { to: '/business/transactions', label: 'Sales' },
      { to: '/business/listing', label: 'Listing Kit', module: 'storefront' },
      { to: '/business/leads', label: 'Leads', module: 'storefront' },
      { to: '/reports/business', label: 'Report' },
    ],
  },
  {
    id: 'rucoy',
    group: 'Trading',
    caption: 'Gold & trades',
    label: 'Rucoy',
    icon: Gamepad2,
    module: 'trading',
    tabs: [
      { to: '/rucoy', label: 'Summary', end: true },
      { to: '/rucoy/trades', label: 'Trades' },
      { to: '/rucoy/calculator', label: 'Gold Calculator' },
    ],
  },
  {
    id: 'master',
    group: 'Overview',
    caption: 'Net worth, logs & undo',
    label: 'Master File',
    icon: FolderOpen,
    module: 'master',
    tabs: [
      { to: '/master', label: 'Overview', end: true },
      { to: '/logs', label: 'Logs' },
      { to: '/master/undo', label: 'Undo' },
    ],
  },
  {
    id: 'account',
    group: 'Account',
    caption: 'Profile & users',
    label: 'Account',
    icon: CircleUserRound,
    hideInSidebar: true,
    tabs: [
      { to: '/profile', label: 'Profile', end: true },
      { to: '/users', label: 'Users', adminOnly: true },
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

/** Sections and tabs this user may see: what their modules open (and Users for admins). */
export function visibleSections(access: { can: (m: Module) => boolean; admin: boolean }): NavSection[] {
  const shows = (x: { module?: Module; adminOnly?: boolean }) => (!x.module || access.can(x.module)) && (!x.adminOnly || access.admin)
  return NAV_SECTIONS.filter(shows).map((s) => ({ ...s, tabs: s.tabs.filter(shows) })).filter((s) => s.tabs.length > 0)
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
  account: {
    icon: 'text-pink-600 dark:text-pink-400',
    iconBg: 'bg-pink-100 dark:bg-pink-900/40',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    tabActive: 'border-pink-500 text-pink-700 dark:border-pink-400 dark:text-pink-300',
  },
}
