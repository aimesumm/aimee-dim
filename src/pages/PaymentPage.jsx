import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import CustomerDetailsCard from '../components/CustomerDetailsCard'
import PaymentMethodPicker from '../components/PaymentMethodPicker'
import KlikQrisPaymentCard from '../components/KlikQrisPaymentCard'
import PaymentSuccessTransition from '../components/PaymentSuccessTransition'
import { checkPayment, createOrder, createQris } from '../services/paymentGateway'
import { useCart } from '../context/CartContext'
import { useOrderDraft } from '../context/OrderDraftContext'
import { normalizeOrder, readLastOrder, writeLastOrder } from '../lib/orderHelpers'

const STATUS_CHECK_SECONDS = 10
const SUCCESS_ANIMATION_MS = 1500

function isPaidStatus(order) {
  const status = String(order?.paymentStatus || order?.status || order?.qris?.status || '').toLowerCase()
  return status === 'paid' || status === 'completed' || status === 'success'
}

function isExpiredStatus(order) {
  return String(order?.paymentStatus || order?.status || order?.qris?.status || '').toLowerCase() === 'expired'
}

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
  const [nextCheckIn, setNextCheckIn] = useState(STATUS_CHECK_SECONDS)
  const [showSuccessTransition, setShowSuccessTransition] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState(() => String(routeMethod || location.state?.method || initialOrder?.paymentMethod || initialOrder?.method || preferredMethod || 'QRIS').toUpperCase())

  const checkoutTransitionRef = useRef(false)
  const successNavigationRef = useRef(false)
  const statusRequestRef = useRef(false)
  const expirationCheckRef = useRef(false)

  const currentMethod = String(order?.paymentMethod || order?.method || selectedMethod || 'QRIS').toUpperCase()
  const isQris = currentMethod === 'QRIS'
  const qris = order?.qris || null

  const mergeOrder = (payload, fallback = order) => normalizeOrder(payload, fallback)

  const goPaid = (payload) => {
    const normalized = normalizeOrder(payload, order)
    if (!normalized?.orderId || successNavigationRef.current) return

    successNavigationRef.current = true
    writeLastOrder(normalized)
    setOrder(normalized)
    setShowSuccessTransition(true)

    window.setTimeout(() => {
      navigate(`/success/qris/${normalized.orderId}`, { replace: true, state: { order: normalized } })
    }, SUCCESS_ANIMATION_MS)
  }

  const goExpired = (payload) => {
    const normalized = normalizeOrder(payload, order)
    if (!normalized?.orderId || successNavigationRef.current) return
    writeLastOrder(normalized)
    navigate(`/payment-failed/${normalized.orderId}`, { replace: true, state: { order: normalized } })
  }

  const requestPaymentStatus = async ({ manual = false } = {}) => {
    if (!order?.orderId || statusRequestRef.current || successNavigationRef.current) return

    statusRequestRef.current = true
    if (manual) setChecking(true)
    setError('')

    try {
      const latest = await checkPayment(order.orderId)
      if (!latest?.orderId) return

      const normalized = mergeOrder(latest, order)
      setOrder(normalized)
      writeLastOrder(normalized)
      setNextCheckIn(STATUS_CHECK_SECONDS)

      if (isPaidStatus(normalized)) {
        goPaid(normalized)
      } else if (isExpiredStatus(normalized)) {
        goExpired(normalized)
      }
    } catch (err) {
      if (manual) setError(err.message || 'Gagal mengecek pembayaran.')
    } finally {
      statusRequestRef.current = false
      if (manual) setChecking(false)
    }
  }

  useEffect(() => {
    if (draftMode && !cart.length && !checkoutTransitionRef.current) {
      navigate('/order', { replace: true })
    }
  }, [draftMode, cart.length, navigate])

  useEffect(() => {
    if (!orderId || order) return

    let cancelled = false

    const load = async () => {
      try {
        const latest = await checkPayment(orderId)
        if (cancelled || !latest?.orderId) return

        const normalized = mergeOrder(latest)
        setOrder(normalized)
        writeLastOrder(normalized)
        setPreferredMethod(String(normalized.paymentMethod || normalized.method || routeMethod || preferredMethod || 'QRIS').toUpperCase())

        if (isPaidStatus(normalized)) goPaid(normalized)
        else if (isExpiredStatus(normalized)) goExpired(normalized)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Gagal memuat pembayaran.')
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
    if (!order?.orderId || !isQris || showSuccessTransition) return
    if (isPaidStatus(order) || isExpiredStatus(order)) return

    const timer = window.setInterval(() => {
      setNextCheckIn((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [order?.orderId, isQris, showSuccessTransition])

  useEffect(() => {
    if (nextCheckIn !== 0 || !order?.orderId || !isQris || showSuccessTransition) return
    if (isPaidStatus(order) || isExpiredStatus(order)) return
    void requestPaymentStatus()
  }, [nextCheckIn, order?.orderId, isQris, showSuccessTransition])

  useEffect(() => {
    if (!order?.orderId || !isQris || showSuccessTransition) return

    const expiredAt = qris?.expired_at
    if (!expiredAt) return

    const normalized = String(expiredAt).replace(' ', 'T')
    const withWitaOffset = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized) ? normalized : `${normalized}+08:00`
    const expiresAt = new Date(withWitaOffset).getTime()
    if (!Number.isFinite(expiresAt)) return

    const timer = window.setInterval(() => {
      if (Date.now() >= expiresAt && !expirationCheckRef.current) {
        expirationCheckRef.current = true
        void requestPaymentStatus()
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [order?.orderId, isQris, qris?.expired_at, showSuccessTransition])

  useEffect(() => {
    if (!order?.orderId || !isQris) return
    if (qris?.status === 'EXPIRED' || qris?.status === 'SUCCESS') return
    if (qris?.qris_url || qris?.qris_image) return
    if (qris?.signature) {
      void requestPaymentStatus()
      return
    }

    let cancelled = false

    const ensureQris = async () => {
      setGenerating(true)
      setError('')
      try {
        const response = await createQris({
          orderId: order.orderId,
          amount: Number(order.total || 0),
          keterangan: `Pembayaran Order ${order.orderId}`,
        })

        if (cancelled) return
        const next = normalizeOrder(response.order || { ...order, qris: response.qris, total: response.totalAmount }, order)
        setOrder(next)
        writeLastOrder(next)
        setNextCheckIn(STATUS_CHECK_SECONDS)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Gagal membuat QRIS KlikQRIS.')
      } finally {
        if (!cancelled) {
          setGenerating(false)
          setBootstrapping(false)
        }
      }
    }

    ensureQris()
    return () => {
      cancelled = true
    }
  }, [order?.orderId, isQris, qris?.qris_url, qris?.qris_image, qris?.signature, qris?.status])

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

  if (draftMode) {
    return (
      <div className="app-shell">
        <main className="container payment-gateway-page payment-draft-page">
          <CustomerDetailsCard
            hideNote
            title="Isi data diri anda"
            copy="Nama, nomor WhatsApp, dan email untuk detail pesanan dan pembayaran."
          />
          <PaymentMethodPicker value={selectedMethod} onChange={(method) => { setSelectedMethod(method); setPreferredMethod(method) }} onContinue={submitDraftPayment} loading={submitting} />
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
            <p>Menghubungkan transaksi ke KlikQRIS.</p>
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
          <KlikQrisPaymentCard
            order={order}
            qris={qris}
            checking={checking}
            generating={generating}
            qrisError={error}
            onCheck={() => requestPaymentStatus({ manual: true })}
            nextCheckIn={nextCheckIn}
          />
        </main>
        <AnimatePresence>
          {showSuccessTransition ? <PaymentSuccessTransition orderId={order.orderId} /> : null}
        </AnimatePresence>
      </div>
    )
  }

  return null
}
