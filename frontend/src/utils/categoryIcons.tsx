import {
  Baby, Banknote, Briefcase, Bus, Car, Coffee, CreditCard, Dumbbell, Fuel, Gamepad2, Gift, GraduationCap, HandCoins,
  HeartPulse, Home, Landmark, Laptop, Music, PawPrint, PiggyBank, Plane, Receipt, Shirt, ShoppingBag, ShoppingCart,
  Smartphone, Sparkles, Tag, TrendingUp, Tv, Utensils, Wallet, Wifi, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react'
import type { Category } from '@/types'

/** Icons a category can use; keys are what's stored in categories.icon. */
export const CATEGORY_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  'tag':            { label: 'General',       Icon: Tag },
  'shopping-cart':  { label: 'Groceries',     Icon: ShoppingCart },
  'shopping-bag':   { label: 'Shopping',      Icon: ShoppingBag },
  'utensils':       { label: 'Food',          Icon: Utensils },
  'coffee':         { label: 'Coffee',        Icon: Coffee },
  'home':           { label: 'Home',          Icon: Home },
  'zap':            { label: 'Utilities',     Icon: Zap },
  'wifi':           { label: 'Internet',      Icon: Wifi },
  'smartphone':     { label: 'Phone',         Icon: Smartphone },
  'car':            { label: 'Car',           Icon: Car },
  'bus':            { label: 'Commute',       Icon: Bus },
  'fuel':           { label: 'Fuel',          Icon: Fuel },
  'plane':          { label: 'Travel',        Icon: Plane },
  'heart-pulse':    { label: 'Health',        Icon: HeartPulse },
  'dumbbell':       { label: 'Fitness',       Icon: Dumbbell },
  'graduation-cap': { label: 'Education',     Icon: GraduationCap },
  'baby':           { label: 'Kids',          Icon: Baby },
  'paw-print':      { label: 'Pets',          Icon: PawPrint },
  'shirt':          { label: 'Clothes',       Icon: Shirt },
  'tv':             { label: 'Entertainment', Icon: Tv },
  'gamepad':        { label: 'Games',         Icon: Gamepad2 },
  'music':          { label: 'Music',         Icon: Music },
  'gift':           { label: 'Gifts',         Icon: Gift },
  'sparkles':       { label: 'Personal',      Icon: Sparkles },
  'wrench':         { label: 'Repairs',       Icon: Wrench },
  'receipt':        { label: 'Bills',         Icon: Receipt },
  'credit-card':    { label: 'Card',          Icon: CreditCard },
  'landmark':       { label: 'Bank',          Icon: Landmark },
  'briefcase':      { label: 'Work',          Icon: Briefcase },
  'laptop':         { label: 'Freelance',     Icon: Laptop },
  'banknote':       { label: 'Cash',          Icon: Banknote },
  'wallet':         { label: 'Allowance',     Icon: Wallet },
  'hand-coins':     { label: 'Payment',       Icon: HandCoins },
  'piggy-bank':     { label: 'Savings',       Icon: PiggyBank },
  'trending-up':    { label: 'Investments',   Icon: TrendingUp },
}

/** Accepts stored keys in any casing, e.g. 'shopping-cart', 'ShoppingCart', 'Briefcase'. */
export function categoryIcon(key: string | null | undefined): LucideIcon {
  if (!key) return Tag
  const normalized = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  return (CATEGORY_ICONS[normalized] ?? CATEGORY_ICONS[key.toLowerCase()])?.Icon ?? Tag
}

/** Coloured rounded tile with the category's icon. */
export function CategoryIcon({ category, size = 'md', className = '' }: {
  category: Pick<Category, 'color' | 'icon' | 'name'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const Icon = categoryIcon(category.icon)
  const box  = size === 'sm' ? 'h-7 w-7 rounded-lg' : size === 'lg' ? 'h-11 w-11 rounded-xl' : 'h-9 w-9 rounded-xl'
  const icon = size === 'sm' ? 13 : size === 'lg' ? 20 : 16
  return (
    <span
      className={['flex shrink-0 items-center justify-center text-white shadow-sm', box, className].join(' ')}
      style={{ backgroundColor: category.color }}
      title={category.name}
    >
      <Icon size={icon} />
    </span>
  )
}

/** Extra colours offered on top of the original palette. */
export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
  '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#64748b',
]
