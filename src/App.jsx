
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import OriginalVariantPage from './pages/OriginalVariantPage'
import OrderPage from './pages/OrderPage'
import PaymentPage from './pages/PaymentPage'
import QrisSuccessPage from './pages/QrisSuccessPage'
import CashSuccessPage from './pages/CashSuccessPage'
import PaymentFailedPage from './pages/PaymentFailedPage'
import { CartProvider } from './context/CartContext'
import { OrderDraftProvider } from './context/OrderDraftContext'

export default function App() {
  return (
    <CartProvider>
      <OrderDraftProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/variant/:id" element={<OriginalVariantPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/checkout" element={<Navigate to="/order" replace />} />
            <Route path="/payment/:method/:orderId" element={<PaymentPage />} />
            <Route path="/pay/:method/:orderId" element={<Navigate to="/payment/:method/:orderId" replace />} />
            <Route path="/success/qris/:orderId" element={<QrisSuccessPage />} />
            <Route path="/success/cash/:orderId" element={<CashSuccessPage />} />
            <Route path="/payment-failed/:orderId" element={<PaymentFailedPage />} />
            <Route path="/payment-success" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </OrderDraftProvider>
    </CartProvider>
  )
}
