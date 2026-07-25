
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import OrderPage from './pages/OrderPage'
import PaymentPage from './pages/PaymentPage'
import QrisSuccessPage from './pages/QrisSuccessPage'
import CashSuccessPage from './pages/CashSuccessPage'
import PaymentFailedPage from './pages/PaymentFailedPage'
import { CartProvider } from './context/CartContext'
import { OrderDraftProvider } from './context/OrderDraftContext'
import StarsBackground from './components/StarsBackground'

export default function App() {
  useEffect(() => {
    let lenisInstance = null
    let frameId = 0
    let cancelled = false

    const start = async () => {
      try {
        const { default: Lenis } = await import('lenis')
        if (cancelled) return

        lenisInstance = new Lenis({
          smoothWheel: true,
          smoothTouch: true,
          duration: 1.05,
          easing: (t) => 1 - Math.pow(1 - t, 3),
        })

        const raf = (time) => {
          lenisInstance?.raf(time)
          frameId = window.requestAnimationFrame(raf)
        }

        frameId = window.requestAnimationFrame(raf)
      } catch {
        // Lenis is optional; native scroll stays as fallback.
      }
    }

    start()

    return () => {
      cancelled = true
      if (frameId) window.cancelAnimationFrame(frameId)
      if (lenisInstance) lenisInstance.destroy()
    }
  }, [])

  return (
    <CartProvider>
      <OrderDraftProvider>
        <StarsBackground />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MenuPage />} />
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
