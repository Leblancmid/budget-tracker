import {
  Banknote, Bitcoin, Briefcase, Building2, Coins, CreditCard, DollarSign, Gem, Landmark, PiggyBank, Smartphone, Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { BalanceAccountConfig } from '@/types'

/** Colour themes an account can use. Class names are spelled out in full so Tailwind generates them. */
export interface AccountColor {
  label: string
  swatch: string   // solid dot / picker swatch
  bar: string      // allocation bar segment (on dark hero)
  heroText: string // value text on the dark hero
  soft: string     // card header tint
  iconTile: string // icon background + colour
  text: string     // balance value
  badge: string    // history pill
  ring: string     // selected-card ring
}

export const ACCOUNT_COLORS: Record<string, AccountColor> = {
  blue:    { label: 'Blue',    swatch: 'bg-blue-500',    bar: 'bg-blue-400',    heroText: 'text-blue-300',    soft: 'bg-blue-50/70 dark:bg-blue-900/10',       iconTile: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',          text: 'text-blue-700 dark:text-blue-400',       badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',          ring: 'ring-blue-400 dark:ring-blue-500' },
  sky:     { label: 'Sky',     swatch: 'bg-sky-500',     bar: 'bg-sky-400',     heroText: 'text-sky-300',     soft: 'bg-sky-50/70 dark:bg-sky-900/10',         iconTile: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',              text: 'text-sky-700 dark:text-sky-400',         badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',              ring: 'ring-sky-400 dark:ring-sky-500' },
  cyan:    { label: 'Cyan',    swatch: 'bg-cyan-500',    bar: 'bg-cyan-400',    heroText: 'text-cyan-300',    soft: 'bg-cyan-50/70 dark:bg-cyan-900/10',       iconTile: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400',          text: 'text-cyan-700 dark:text-cyan-400',       badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',          ring: 'ring-cyan-400 dark:ring-cyan-500' },
  teal:    { label: 'Teal',    swatch: 'bg-teal-500',    bar: 'bg-teal-400',    heroText: 'text-teal-300',    soft: 'bg-teal-50/70 dark:bg-teal-900/10',       iconTile: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400',          text: 'text-teal-700 dark:text-teal-400',       badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',          ring: 'ring-teal-400 dark:ring-teal-500' },
  green:   { label: 'Green',   swatch: 'bg-green-500',   bar: 'bg-green-400',   heroText: 'text-green-300',   soft: 'bg-green-50/70 dark:bg-green-900/10',     iconTile: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',      text: 'text-green-700 dark:text-green-400',     badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',      ring: 'ring-green-400 dark:ring-green-500' },
  lime:    { label: 'Lime',    swatch: 'bg-lime-500',    bar: 'bg-lime-400',    heroText: 'text-lime-300',    soft: 'bg-lime-50/70 dark:bg-lime-900/10',       iconTile: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400',          text: 'text-lime-700 dark:text-lime-400',       badge: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',          ring: 'ring-lime-400 dark:ring-lime-500' },
  yellow:  { label: 'Yellow',  swatch: 'bg-yellow-400',  bar: 'bg-yellow-300',  heroText: 'text-yellow-300',  soft: 'bg-yellow-50/70 dark:bg-yellow-900/10',   iconTile: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',  text: 'text-yellow-700 dark:text-yellow-400',   badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',  ring: 'ring-yellow-400 dark:ring-yellow-500' },
  amber:   { label: 'Amber',   swatch: 'bg-amber-500',   bar: 'bg-amber-400',   heroText: 'text-amber-300',   soft: 'bg-amber-50/70 dark:bg-amber-900/10',     iconTile: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',      text: 'text-amber-700 dark:text-amber-400',     badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',      ring: 'ring-amber-400 dark:ring-amber-500' },
  orange:  { label: 'Orange',  swatch: 'bg-orange-500',  bar: 'bg-orange-400',  heroText: 'text-orange-300',  soft: 'bg-orange-50/70 dark:bg-orange-900/10',   iconTile: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',  text: 'text-orange-700 dark:text-orange-400',   badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',  ring: 'ring-orange-400 dark:ring-orange-500' },
  red:     { label: 'Red',     swatch: 'bg-red-500',     bar: 'bg-red-400',     heroText: 'text-red-300',     soft: 'bg-red-50/70 dark:bg-red-900/10',         iconTile: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',              text: 'text-red-700 dark:text-red-400',         badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',              ring: 'ring-red-400 dark:ring-red-500' },
  rose:    { label: 'Rose',    swatch: 'bg-rose-500',    bar: 'bg-rose-400',    heroText: 'text-rose-300',    soft: 'bg-rose-50/70 dark:bg-rose-900/10',       iconTile: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',          text: 'text-rose-700 dark:text-rose-400',       badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',          ring: 'ring-rose-400 dark:ring-rose-500' },
  pink:    { label: 'Pink',    swatch: 'bg-pink-500',    bar: 'bg-pink-400',    heroText: 'text-pink-300',    soft: 'bg-pink-50/70 dark:bg-pink-900/10',       iconTile: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400',          text: 'text-pink-700 dark:text-pink-400',       badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',          ring: 'ring-pink-400 dark:ring-pink-500' },
  violet:  { label: 'Violet',  swatch: 'bg-violet-500',  bar: 'bg-violet-400',  heroText: 'text-violet-300',  soft: 'bg-violet-50/70 dark:bg-violet-900/10',   iconTile: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',  text: 'text-violet-700 dark:text-violet-400',   badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',  ring: 'ring-violet-400 dark:ring-violet-500' },
  indigo:  { label: 'Indigo',  swatch: 'bg-indigo-500',  bar: 'bg-indigo-400',  heroText: 'text-indigo-300',  soft: 'bg-indigo-50/70 dark:bg-indigo-900/10',   iconTile: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',  text: 'text-indigo-700 dark:text-indigo-400',   badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',  ring: 'ring-indigo-400 dark:ring-indigo-500' },
  slate:   { label: 'Slate',   swatch: 'bg-slate-500',   bar: 'bg-slate-300',   heroText: 'text-slate-200',   soft: 'bg-slate-50/70 dark:bg-slate-800/30',     iconTile: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',         text: 'text-slate-700 dark:text-slate-300',     badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',         ring: 'ring-slate-400 dark:ring-slate-500' },
}

export const colorOf = (key: string): AccountColor => ACCOUNT_COLORS[key] ?? ACCOUNT_COLORS.slate

export const ACCOUNT_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  wallet:       { label: 'Wallet',     Icon: Wallet },
  coins:        { label: 'Coins',      Icon: Coins },
  landmark:     { label: 'Bank',       Icon: Landmark },
  building:     { label: 'Building',   Icon: Building2 },
  smartphone:   { label: 'E-wallet',   Icon: Smartphone },
  'credit-card':{ label: 'Card',       Icon: CreditCard },
  banknote:     { label: 'Cash',       Icon: Banknote },
  'piggy-bank': { label: 'Savings',    Icon: PiggyBank },
  bitcoin:      { label: 'Crypto',     Icon: Bitcoin },
  dollar:       { label: 'Dollar',     Icon: DollarSign },
  gem:          { label: 'Gem',        Icon: Gem },
  briefcase:    { label: 'Business',   Icon: Briefcase },
}

export const iconOf = (key: string): LucideIcon => (ACCOUNT_ICONS[key] ?? ACCOUNT_ICONS.wallet).Icon

export const fmtUsd = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const fmtPhp = (n: number) => `₱${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const fmtIn  = (account: Pick<BalanceAccountConfig, 'currency'> | undefined, n: number) =>
  account?.currency === 'PHP' ? fmtPhp(n) : fmtUsd(n)
