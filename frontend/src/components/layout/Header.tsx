import { useLocation } from 'react-router-dom'

const TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/transactions': 'Transactions',
  '/categories':   'Categories',
  '/budgets':      'Budgets',
}

export function Header() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? 'Budget Tracker'

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
    </header>
  )
}
