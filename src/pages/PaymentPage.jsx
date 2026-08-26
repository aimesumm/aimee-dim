import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import CustomerDetailsCard from '../components/CustomerDetailsCard'
import PaymentMethodPicker from '../components/PaymentMethodPicker'
import PaymentConfirmationCard from '../components/PaymentConfirmationCard'
import { checkPayment, createOrder, createQris, getOrderStatus } from '../services/paymentGateway'
import { useCart } from '../context/CartContext'
import { useOrderDraft } from '../context/OrderDraftContext'
import { normalizeOrder, readLastOrder, writeLastOrder } from '../lib/orderHelpers'

const POLL_INTERVAL_MS = 3000

export default function PaymentPage() {
  const { method: routeMethod, orderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { customer, preferredMethod, setPreferredMethod } = useOrderDraft()

  const initialOrder = useMemo(() => {
    const stateOrder = location.state?.order || readLastOrder()
    if (!orderId) return null
    if (stateOrder?.orderId && String(stateOrder.orderId) === String(orderId)) return normalizeOrder(stateOrder)
    return null
  }, [location.state, orderId])

  const draftMode = !orderId
  const [order, setOrder] = useState(() => initialOrder || null)
  const [bootstrapping, setBootstrapping] = useState(Boolean(orderId && !initialOrder))
  const [checking, setChecking] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedMethod, setSelectedMethod] = useState(() => String(routeMethod || location.state?.method || initialOrder?.paymentMethod || initialOrder?.method || preferredMethod || 'QRIS').toUpperCase())
  const checkoutTransitionRef = useRef(false)

  const currentMethod = String(order?.paymentMethod || order?.method || selectedMethod || routeMethod || 'QRIS').toUpperCase()
  const isQris = currentMethod === 'QRIS'
  const qris = order?.qris || null

  const mergeOrder = (payload, fallback = order) => normalizeOrder(payload, fallback)

  const goPaid = (payload) => {
    const normalized = normalizeOrder(payload, order)
    if (!normalized?.orderId) return
    writeLastOrder(normalized)
    const method = String(normalized.paymentMethod || normalized.method || routeMethod || 'qris').toLowerCase()
    navigate(`/success/${method}/${normalized.orderId}`, { replace: true, state: { order: normalized } })
  }

  const goExpired = (payload) => {
    const normalized = normalizeOrder(payload, order)
    if (!normalized?.orderId) return
    writeLastOrder(normalized)
    navigate(`/payment-failed/${normalized.orderId}`, { replace: true, state: { order: normalized } })
  }

  useEffect(() => {
    if (draftMode && !cart.length && !checkoutTransitionRef.current) {
      navigate('/order', { replace: true })
    }
  }, [draftMode, cart.length, navigate])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!orderId || order) return
      try {
        const latest = await getOrderStatus(orderId)
        if (cancelled || !latest?.orderId) return
        const normalized = mergeOrder(latest)
        setOrder(normalized)
        writeLastOrder(normalized)
        setSelectedMethod(String(normalized.paymentMethod || normalized.method || routeMethod || preferredMethod || 'QRIS').toUpperCase())
        const status = String(normalized.paymentStatus || normalized.status || 'pending').toLowerCase()
        if (status === 'paid' || status === 'completed') goPaid(normalized)
        else if (status === 'expired') goExpired(normalized)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Gagal memuat order.')
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [orderId, order, routeMethod, preferredMethod])

  useEffect(() => {
    if (!order?.orderId) return
    const status = String(order.paymentStatus || order.status || 'pending').toLowerCase()
    if (status === 'paid' || status === 'completed' || status === 'expired') return

    const poll = window.setInterval(async () => {
      try {
        const latest = await checkPayment(order.orderId)
        if (!latest?.orderId) return
        const normalized = mergeOrder(latest, order)
        setOrder(normalized)
        writeLastOrder(normalized)
        const nextStatus = String(normalized.paymentStatus || normalized.status || 'pending').toLowerCase()
        if (nextStatus === 'paid' || nextStatus === 'completed') goPaid(normalized)
        if (nextStatus === 'expired') goExpired(normalized)
      } catch {
        // Retry silently; webhook remains the primary instant update path.
      }
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(poll)
  }, [order, routeMethod])

  useEffect(() => {
    const ensureQris = async () => {
      if (!order?.orderId || !isQris) return
      const existing = order.qris
      if (existing?.qris_url || existing?.qris_image || existing?.signature) return

      setGenerating(true)
      setError('')
      try {
        const response = await createQris({
          orderId: order.orderId,
          amount: Number(order.total || 0),
          keterangan: `Pembayaran Order ${order.orderId}`,
        })
        const next = normalizeOrder({ ...order, qris: response.qris }, order)
        setOrder(next)
        writeLastOrder(next)
      } catch (err) {
        setError(err.message || 'Gagal membuat QRIS dinamis.')
      } finally {
        setGenerating(false)
        setBootstrapping(false)
      }
    }

    ensureQris()
  }, [order?.orderId, isQris])

  const submitDraftPayment = async () => {
    if (!cart.length) {
      setError('Keranjang masih kosong.')
      return
    }

    if (!customer.name.trim() || !customer.phone.trim() || !customer.email.trim()) {
      setError('Isi nama, nomor WhatsApp, dan email pelanggan terlebih dahulu.')
      return
    }

    setSubmitting(true)
    setError('')
    setPreferredMethod(selectedMethod)

    try {
      const items = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        basePrice: item.basePrice ?? item.price,
        variantPrice: item.variantPrice ?? 0,
        qty: item.qty,
        category: item.category,
        variant: item.variant,
        variantLabel: item.variantLabel,
      }))

      const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0)
      const created = await createOrder({
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        customerEmail: customer.email.trim(),
        note: customer.note.trim(),
        items,
        itemCount: items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
        subtotal,
        total: subtotal,
        paymentMethod: selectedMethod,
      })

      const nextOrder = normalizeOrder(created)
      writeLastOrder(nextOrder)
      checkoutTransitionRef.current = true

      if (String(selectedMethod).toUpperCase() === 'CASH') {
        clearCart()
        navigate(`/success/cash/${created.orderId}`, { replace: true, state: { order: nextOrder } })
      } else {
        navigate(`/payment/qris/${created.orderId}`, { replace: true, state: { order: nextOrder } })
        window.setTimeout(() => clearCart(), 0)
      }
    } catch (err) {
      setError(err.message || 'Checkout gagal.')
    } finally {
      setSubmitting(false)
    }
  }

  const onCheck = async () => {
    if (!order?.orderId || checking) return
    setChecking(true)
    setError('')
    try {
      const latest = await checkPayment(order.orderId)
      const normalized = mergeOrder(latest, order)
      setOrder(normalized)
      writeLastOrder(normalized)
      const status = String(normalized.paymentStatus || normalized.status || 'pending').toLowerCase()
      if (status === 'paid' || status === 'completed') goPaid(normalized)
      else if (status === 'expired') goExpired(normalized)
    } catch (err) {
      setError(err.message || 'Gagal mengecek status pembayaran.')
    } finally {
      setChecking(false)
    }
  }

  const retryQris = async () => {
    if (!order?.orderId) return
    setGenerating(true)
    setError('')
    try {
      const response = await createQris({
        orderId: order.orderId,
        amount: Number(order.total || 0),
        keterangan: `Pembayaran Order ${order.orderId}`,
      })
      const next = normalizeOrder({ ...order, qris: response.qris }, order)
      setOrder(next)
      writeLastOrder(next)
    } catch (err) {
      setError(err.message || 'Gagal membuat QRIS dinamis.')
    } finally {
      setGenerating(false)
    }
  }

  if (draftMode) {
    return (
      <div className="app-shell">
        <main className="container payment-gateway-page payment-draft-page">
          <CustomerDetailsCard
            hideNote
            title="Isi data diri anda"
            copy="Nama, nomor WhatsApp, dan email untuk detail pesanan dan pembayaran."
          />
          <PaymentMethodPicker value={selectedMethod} onChange={setSelectedMethod} onContinue={submitDraftPayment} loading={submitting} />
          {error ? <div className="notice error">{error}</div> : null}
        </main>
      </div>
    )
  }

  if (bootstrapping && !order?.orderId) {
    return (
      <div className="app-shell">
        <main className="container payment-gateway-page">
          <div className="payment-loader-box">
            <div className="loading-spinner" />
            <strong>Memuat pembayaran...</strong>
            <p>Menghubungkan ke payment gateway KlikQRIS.</p>
          </div>
        </main>
      </div>
    )
  }

  if (!order?.orderId) {
    return (
      <div className="app-shell">
        <main className="container payment-gateway-page">
          <div className="payment-error-box">
            <strong>Order belum ditemukan</strong>
            <p>Silakan kembali ke halaman order dan coba lagi.</p>
            <button className="primary-btn" type="button" onClick={() => navigate('/order', { replace: true })}>Kembali ke Order</button>
          </div>
        </main>
      </div>
    )
  }

  if (isQris) {
    return (
      <div className="app-shell">
        <main className="container payment-gateway-page">
          <PaymentConfirmationCard
            order={order}
            isQris
            qris={qris}
            checking={checking}
            onConfirm={onCheck}
            generating={generating}
            qrisError={error}
            onRetryQris={retryQris}
          />
        </main>
      </div>
    )
  }

  return null
}
