import { lazy, Suspense } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { PageLoading } from '@/components/PageLoading'

const ChoosePassword = lazy(() => import('@/pages/account/ChoosePassword'))

export function PrivateRoute() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // A password an admin chose: the person picks their own before using the app
  if (user?.must_change_password) return <Suspense fallback={<PageLoading />}><ChoosePassword /></Suspense>
  return <Outlet />
}
