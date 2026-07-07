import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AmountVisibilityProvider } from '@/context/AmountVisibilityContext'
import { AuthProvider } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { PrivateRoute } from '@/components/PrivateRoute'
import { Dashboard } from '@/pages/Dashboard'
import { Transactions } from '@/pages/Transactions'
import { Categories } from '@/pages/Categories'
import { Budgets } from '@/pages/Budgets'
import { ToastContainer } from '@/components/ui/Toast'

const Login               = lazy(() => import('@/pages/Login'))

const MasterDashboard     = lazy(() => import('@/pages/master/MasterDashboard'))
const Savings             = lazy(() => import('@/pages/master/Savings'))

const RucoyDashboard      = lazy(() => import('@/pages/rucoy/RucoyDashboard'))
const Golds               = lazy(() => import('@/pages/rucoy/Golds'))
const Trades              = lazy(() => import('@/pages/rucoy/Trades'))
const Accounts            = lazy(() => import('@/pages/rucoy/Accounts'))
const GoldCalculator      = lazy(() => import('@/pages/rucoy/GoldCalculator'))

const BusinessDashboard   = lazy(() => import('@/pages/business/BusinessDashboard'))
const BusinessTransactions = lazy(() => import('@/pages/business/BusinessTransactions'))

function Loading() {
  return <div className="flex items-center justify-center h-40 text-gray-400">Loading…</div>
}

export default function App() {
  return (
    <ThemeProvider>
      <AmountVisibilityProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.VITE_BASE_URL ?? '/'}>
            <Routes>

              {/* Public */}
              <Route path="/login" element={<Suspense fallback={<Loading />}><Login /></Suspense>} />

              {/* Protected */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path="/"             element={<Dashboard />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/categories"   element={<Categories />} />
                  <Route path="/budgets"      element={<Budgets />} />

                  <Route path="/master"         element={<Suspense fallback={<Loading />}><MasterDashboard /></Suspense>} />
                  <Route path="/master/savings" element={<Suspense fallback={<Loading />}><Savings /></Suspense>} />

                  <Route path="/rucoy"              element={<Suspense fallback={<Loading />}><RucoyDashboard /></Suspense>} />
                  <Route path="/rucoy/golds"        element={<Suspense fallback={<Loading />}><Golds /></Suspense>} />
                  <Route path="/rucoy/trades"       element={<Suspense fallback={<Loading />}><Trades /></Suspense>} />
                  <Route path="/rucoy/accounts"     element={<Suspense fallback={<Loading />}><Accounts /></Suspense>} />
                  <Route path="/rucoy/calculator"   element={<Suspense fallback={<Loading />}><GoldCalculator /></Suspense>} />

                  <Route path="/business"              element={<Suspense fallback={<Loading />}><BusinessDashboard /></Suspense>} />
                  <Route path="/business/transactions" element={<Suspense fallback={<Loading />}><BusinessTransactions /></Suspense>} />
                </Route>
              </Route>

            </Routes>
            <ToastContainer />
          </BrowserRouter>
        </AuthProvider>
      </AmountVisibilityProvider>
    </ThemeProvider>
  )
}