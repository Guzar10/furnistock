import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import WarehousesPage from './pages/WarehousesPage'
import StockPage from './pages/StockPage'
import MovementsPage from './pages/MovementsPage'
import UsersPage from './pages/UsersPage'
import ProductHistoryPage from './pages/ProductHistoryPage'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore(s => s.user)
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="products"   element={<ProductsPage />} />
          <Route path="warehouses" element={<WarehousesPage />} />
          <Route path="stock"      element={<StockPage />} />
          <Route path="movements"  element={<MovementsPage />} />
          <Route path="users"      element={<UsersPage />} />
          <Route path="products/:id/history" element={<ProductHistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}