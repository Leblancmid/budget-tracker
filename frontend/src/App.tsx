import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeProvider'
import { AmountVisibilityProvider } from '@/context/AmountVisibilityProvider'
import { AuthProvider } from '@/context/AuthProvider'
import { useAuth } from '@/context/auth'
import { Layout } from '@/components/layout/Layout'
import { PrivateRoute } from '@/components/PrivateRoute'
import { PageLoading } from '@/components/PageLoading'
import { ToastContainer } from '@/components/ui/Toast'
import { Dashboard } from '@/pages/Dashboard'
import { Transactions } from '@/pages/Transactions'
import { Categories } from '@/pages/Categories'
import { Budgets } from '@/pages/Budgets'

// Daily Expenses pages load up front (every user starts there); the rest load on first visit
const Login               = lazy(() => import('@/pages/Login'))
const MasterDashboard     = lazy(() => import('@/pages/master/MasterDashboard'))
const Balance             = lazy(() => import('@/pages/master/Balance'))
const RucoySummary        = lazy(() => import('@/pages/rucoy/Summary'))
const Trades              = lazy(() => import('@/pages/rucoy/Trades'))
const GoldCalculator      = lazy(() => import('@/pages/rucoy/GoldCalculator'))
const BusinessDashboard   = lazy(() => import('@/pages/business/BusinessDashboard'))
const Sales               = lazy(() => import('@/pages/business/Sales'))
const DailyExpensesReport = lazy(() => import('@/pages/reports/DailyExpensesReport'))
const BusinessReport      = lazy(() => import('@/pages/reports/BusinessReport'))
const Logs                = lazy(() => import('@/pages/Logs'))

/** Pages for admins only; daily-only users are sent to their dashboard. */
function AdminRoute() {
  const { user } = useAuth()
  if (user?.role === 'daily_only') return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <ThemeProvider>
      <AmountVisibilityProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.VITE_BASE_URL ?? '/'}>
            <Routes>

              {/* Public */}
              <Route path="/login" element={<Suspense fallback={<PageLoading />}><Login /></Suspense>} />

              {/* Protected */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path="/"             element={<Dashboard />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/categories"   element={<Categories />} />
                  <Route path="/budgets"      element={<Budgets />} />

                  <Route path="/reports/daily-expenses" element={<DailyExpensesReport />} />

                  <Route element={<AdminRoute />}>
                    <Route path="/master"         element={<MasterDashboard />} />
                    <Route path="/master/balance" element={<Balance />} />

                    <Route path="/rucoy"            element={<RucoySummary />} />
                    <Route path="/rucoy/golds"      element={<Navigate to="/rucoy" replace />} />
                    <Route path="/rucoy/trades"     element={<Trades />} />
                    <Route path="/rucoy/accounts"   element={<Navigate to="/business/transactions" replace />} />
                    <Route path="/rucoy/calculator" element={<GoldCalculator />} />

                    <Route path="/business"              element={<BusinessDashboard />} />
                    <Route path="/business/transactions" element={<Sales />} />

                    <Route path="/reports/business" element={<BusinessReport />} />

                    <Route path="/logs" element={<Logs />} />
                  </Route>
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
