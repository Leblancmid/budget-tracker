import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Transactions } from '@/pages/Transactions'
import { Categories } from '@/pages/Categories'
import { Budgets } from '@/pages/Budgets'
import { ToastContainer } from '@/components/ui/Toast'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/categories"   element={<Categories />} />
          <Route path="/budgets"      element={<Budgets />} />
        </Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}
