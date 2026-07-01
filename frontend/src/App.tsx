import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Transactions } from '@/pages/Transactions'
import { Categories } from '@/pages/Categories'
import { Budgets } from '@/pages/Budgets'
import { ToastContainer } from '@/components/ui/Toast'

const RucoyDashboard = lazy(() => import('@/pages/rucoy/RucoyDashboard'))
const Golds          = lazy(() => import('@/pages/rucoy/Golds'))
const Trades         = lazy(() => import('@/pages/rucoy/Trades'))
const Accounts       = lazy(() => import('@/pages/rucoy/Accounts'))

function Loading() {
  return <div className="flex items-center justify-center h-40 text-gray-400">Loading…</div>
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/categories"   element={<Categories />} />
            <Route path="/budgets"      element={<Budgets />} />
            <Route path="/rucoy" element={<Suspense fallback={<Loading />}><RucoyDashboard /></Suspense>} />
            <Route path="/rucoy/golds"    element={<Suspense fallback={<Loading />}><Golds /></Suspense>} />
            <Route path="/rucoy/trades"   element={<Suspense fallback={<Loading />}><Trades /></Suspense>} />
            <Route path="/rucoy/accounts" element={<Suspense fallback={<Loading />}><Accounts /></Suspense>} />
          </Route>
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </ThemeProvider>
  )
}
