
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { normalizeOrder, readLastOrder } from '../lib/orderHelpers'

export default function PaymentSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const order = normalizeOrder(location.state?.order || readLastOrder())
    if (!order?.orderId) {
      navigate('/order', { replace: true })
      return
    }

    const method = String(order.paymentMethod || order.method || 'qris').toLowerCase()
    navigate(`/success/${method}/${order.orderId}`, { replace: true, state: { order } })
  }, [location.state, navigate])

  return null
}
