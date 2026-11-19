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

/** The face of an account drawn as a bank card: a gradient in its colour (white text stays readable on each). */
const CARD_GRADIENTS: Record<string, string> = {
  blue:   'from-blue-500 via-blue-600 to-indigo-700',
  sky:    'from-sky-500 via-sky-600 to-blue-700',
  cyan:   'from-cyan-500 via-cyan-600 to-teal-700',
  teal:   'from-teal-500 via-teal-600 to-emerald-700',
  green:  'from-green-500 via-green-600 to-emerald-700',
  lime:   'from-lime-500 via-lime-600 to-green-700',
  yellow: 'from-yellow-500 via-amber-500 to-orange-600',
  amber:  'from-amber-400 via-amber-500 to-orange-600',
  orange: 'from-orange-400 via-orange-500 to-orange-600',
  red:    'from-red-500 via-red-600 to-rose-700',
  rose:   'from-rose-500 via-rose-600 to-pink-700',
  pink:   'from-pink-500 via-pink-600 to-fuchsia-700',
  violet: 'from-violet-500 via-violet-600 to-purple-700',
  indigo: 'from-indigo-500 via-indigo-600 to-violet-700',
  slate:  'from-slate-600 via-slate-700 to-slate-900',
}

export const cardGradientOf = (key: string): string => CARD_GRADIENTS[key] ?? CARD_GRADIENTS.slate

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

/**
 * Interest one day earns on a balance: balance × rate% ÷ 365, minus the withheld tax %.
 * Same as the server's daily credit (rounded to the cent).
 */
export function dailyInterest(balance: number, ratePct: number | null | undefined, taxPct = 20): number {
  if (!ratePct || ratePct <= 0 || balance <= 0) return 0
  const keep = 1 - Math.min(Math.max(taxPct, 0), 100) / 100
  return Math.round(((balance * ratePct) / 100 / 365) * keep * 100) / 100
}

/** A credit card (its balance goes below zero as you spend: that's what you owe). */
export const isCredit = (a: Pick<BalanceAccountConfig, 'kind'> | undefined) => a?.kind === 'credit'

/** Add / Sell on a wallet; on a credit card, money in is a Payment and money out is a Spend. */
export const entryTypeLabel = (a: Pick<BalanceAccountConfig, 'kind'> | undefined, type: 'add' | 'sell') =>
  isCredit(a) ? (type === 'add' ? 'Payment' : 'Spend') : (type === 'add' ? 'Add' : 'Sell')

/** What a card owes (0 when it's paid off or in credit). */
export const owedOn = (balance: number) => Math.max(0, -balance)

/**
 * What can still be spent from an account: a wallet's balance, or a card's limit minus what it owes.
 * A card without a limit set has no ceiling (Infinity).
 */
export function spendable(a: Pick<BalanceAccountConfig, 'kind' | 'credit_limit'>, balance: number): number {
  if (!isCredit(a)) return balance
  return a.credit_limit ? a.credit_limit + balance : Infinity
}

/** Share of a card's limit in use, 0–1 (0 without a limit). */
export function creditUsed(a: Pick<BalanceAccountConfig, 'credit_limit'>, balance: number): number {
  if (!a.credit_limit) return 0
  return Math.min(1, owedOn(balance) / a.credit_limit)
}

export const fmtUsd = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const fmtPhp = (n: number) => `₱${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const fmtIn  = (account: Pick<BalanceAccountConfig, 'currency'> | undefined, n: number) =>
  account?.currency === 'PHP' ? fmtPhp(n) : fmtUsd(n)
