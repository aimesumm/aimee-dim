import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import PaymentSuccessCard from '../components/PaymentSuccess'
import { checkPayment } from '../services/paymentGateway'
import { normalizeOrder, readLastOrder, writeLastOrder } from '../lib/orderHelpers'

export default function QrisSuccessPage() {
  const { orderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [order, setOrder] = useState(() => {
    const initial = normalizeOrder(location.state?.order || readLastOrder())
    return initial && String(initial.orderId) === String(orderId) ? initial : null
  })
  const [checking, setChecking] = useState(!order)

  useEffect(() => {
    let cancelled = false

    const verify = async () => {
      if (!orderId) {
        navigate('/order', { replace: true })
        return
      }

      try {
        const latest = await checkPayment(orderId)
        if (cancelled || !latest?.orderId) return

        const normalized = normalizeOrder(latest, order)
        writeLastOrder(normalized)

        const status = String(normalized.paymentStatus || normalized.status || '').toLowerCase()
        if (status === 'paid' || status === 'completed') {
          setOrder(normalized)
        } else if (status === 'expired') {
          navigate(`/payment-failed/${orderId}`, { replace: true, state: { order: normalized } })
        } else {
          navigate(`/payment/qris/${orderId}`, { replace: true, state: { order: normalized } })
        }
      } catch {
        if (!order) navigate(`/payment/qris/${orderId}`, { replace: true, state: { order } })
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [orderId])

  if (checking || !order?.orderId) {
    return (
      <div className="app-shell">
        <main className="container checkout-only-page">
          <div className="payment-loader-box">
            <div className="loading-spinner" />
            <strong>Memastikan pembayaran...</strong>
            <p>Transaksi sedang diverifikasi otomatis.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <main className="container checkout-only-page">
        <PaymentSuccessCard order={order} variant="qris" />
      </main>
    </div>
  )
}
