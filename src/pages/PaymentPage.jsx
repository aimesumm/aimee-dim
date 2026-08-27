import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import CustomerDetailsCard from '../components/CustomerDetailsCard'
import PaymentMethodPicker from '../components/PaymentMethodPicker'
import KlikQrisPaymentCard from '../components/KlikQrisPaymentCard'
import PaymentSuccessTransition from '../components/PaymentSuccessTransition'
import LoadingScreen from '../components/LoadingScreen'
import { checkPayment, createOrder, createQris } from '../services/paymentGateway'
import { useCart } from '../context/CartContext'
import { useOrderDraft } from '../context/OrderDraftContext'
import { normalizeOrder, readLastOrder, writeLastOrder } from '../lib/orderHelpers'
import { parsePrice } from '../data/siteConfig'

const STATUS_CHECK_SECONDS = 10
const SUCCESS_ANIMATION_MS = 1500
const MANUAL_REFRESH_DELAY_MS = 1100

function getExpiryTimestamp(expiredAt) {
  if (!expiredAt) return null

  const raw = String(expiredAt).trim()
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const withOffset = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized) ? normalized : `${normalized}+08:00`
  const timestamp = Date.parse(withOffset)
  return Number.isFinite(timestamp) ? timestamp : null
}

function getPaymentRemainingSeconds(qris) {
  const directExpiry = getExpiryTimestamp(qris?.expired_at)
  if (directExpiry !== null) return Math.max(0, Math.ceil((directExpiry - Date.now()) / 1000))

  const fallbackMinutes = Number(qris?.expired_menit)
  if (Number.isFinite(fallbackMinutes) && fallbackMinutes > 0) {
    const createdAt = getExpiryTimestamp(qris?.created_at)
    if (createdAt !== null) {
      const calculatedExpiry = createdAt + fallbackMinutes * 60_000
      return Math.max(0, Math.ceil((calculatedExpiry - Date.now()) / 1000))
    }
    return Math.round(fallbackMinutes * 60)
  }

  return 0
}

function getPaymentStatuses(order) {
  return [order?.paymentStatus, order?.status, order?.qris?.status]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
}

function isPaidStatus(order) {
  return getPaymentStatuses(order).some((status) => status === 'paid' || status === 'completed' || status === 'success')
}

function isExpiredStatus(order) {
  return getPaymentStatuses(order).some((status) => status === 'expired')
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
  const [paymentRemainingSeconds, setPaymentRemainingSeconds] = useState(0)
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
    let shouldRefresh = false
    if (manual) setChecking(true)
    setError('')

    try {
      const latest = await checkPayment(order.orderId)
      if (!latest?.orderId) {
        throw new Error('Status pembayaran belum mengembalikan data order yang valid.')
      }

      const normalized = mergeOrder(latest, order)
      setOrder(normalized)
      writeLastOrder(normalized)
      setNextCheckIn(STATUS_CHECK_SECONDS)
      setPaymentRemainingSeconds(getPaymentRemainingSeconds(normalized.qris))

      if (manual && (isPaidStatus(normalized) || isExpiredStatus(normalized))) {
        // Manual checking uses the full-page LoadingScreen. Once the gateway
        // reports a terminal state, reload the payment route so the normal
        // paid/expired routing logic runs from the fresh order state.
        shouldRefresh = true
        window.setTimeout(() => window.location.reload(), MANUAL_REFRESH_DELAY_MS)
      } else if (isPaidStatus(normalized)) {
        goPaid(normalized)
      } else if (isExpiredStatus(normalized)) {
        goExpired(normalized)
      }
    } catch (err) {
      if (manual) setError(err.message || 'Gagal mengecek pembayaran.')
    } finally {
      statusRequestRef.current = false
      if (manual && !shouldRefresh) setChecking(false)
    }
  }

  useEffect(() => {
    if (draftMode && !cart.length && !checkoutTransitionRef.current) {
      navigate('/order', { replace: true })
    }
  }, [draftMode, cart.length, navigate])

  useEffect(() => {
    if (!order?.orderId || draftMode || successNavigationRef.current) return
    if (isPaidStatus(order)) {
      goPaid(order)
    } else if (isExpiredStatus(order)) {
      goExpired(order)
    }
  }, [order?.orderId, order?.paymentStatus, order?.status, draftMode])

  useEffect(() => {
    if (!orderId || order) return

    let cancelled = false

    const load = async () => {
      try {
        const latest = await checkPayment(orderId)
        if (cancelled) return

        // The status endpoint is authoritative, but the route state may already
        // contain the complete order. Only replace it when a valid order is returned.
        if (!latest?.orderId) {
          setBootstrapping(false)
          return
        }

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

    setPaymentRemainingSeconds(getPaymentRemainingSeconds(order.qris))

    const timer = window.setInterval(() => {
      setNextCheckIn((current) => Math.max(0, current - 1))
      // Recalculate from expired_at every second instead of decrementing a
      // local counter, so the display stays synchronized with the real expiry.
      setPaymentRemainingSeconds(getPaymentRemainingSeconds(order.qris))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [order?.orderId, isQris, order?.qris?.expired_at, order?.qris?.expired_menit, showSuccessTransition])

  useEffect(() => {
    if (nextCheckIn !== 0 || !order?.orderId || !isQris || showSuccessTransition) return
    if (isPaidStatus(order) || isExpiredStatus(order)) return
    void requestPaymentStatus()
  }, [nextCheckIn, order?.orderId, isQris, showSuccessTransition])

  useEffect(() => {
    if (!order?.orderId || !isQris || showSuccessTransition) return

    const expiredAt = qris?.expired_at
    if (!expiredAt) return

    const expiresAt = getExpiryTimestamp(expiredAt)
    if (expiresAt === null) return

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
          expired_menit: '60',
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
      const items = cart.map((item) => {
        const basePrice = parsePrice(item.basePrice ?? item.price)
        const variantPrice = parsePrice(item.variantPrice)
        const price = item.basePrice !== undefined && item.basePrice !== null
          ? basePrice + variantPrice
          : parsePrice(item.price)

        return {
          id: item.id,
          name: item.name,
          price,
          basePrice,
          variantPrice,
          qty: item.qty,
          category: item.category,
          variant: item.variant,
          variantLabel: item.variantLabel,
        }
      })

      const subtotal = items.reduce((sum, item) => sum + (Number(item.basePrice || 0) + Number(item.variantPrice || 0)) * Number(item.qty || 0), 0)
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

      let nextOrder = normalizeOrder(created)

      // Untuk QRIS, bentuk transaksi KlikQRIS sebelum berpindah halaman.
      // Dengan begitu halaman pembayaran selalu menerima QRIS yang sudah tersedia
      // dan tidak sempat menampilkan "order tidak ditemukan".
      if (String(selectedMethod).toUpperCase() === 'QRIS') {
        const qrisResponse = await createQris({
          orderId: created.orderId,
          amount: Number(created.total || subtotal || 0),
          expired_menit: '60',
          keterangan: `Pembayaran Order ${created.orderId}`,
        })

        nextOrder = normalizeOrder(
          qrisResponse?.order || {
            ...created,
            qris: qrisResponse?.qris || null,
            total: qrisResponse?.totalAmount ?? created.total,
            paymentStatus: 'pending',
            status: 'pending',
          },
          nextOrder,
        )

        if (!nextOrder?.orderId || !nextOrder?.qris) {
          throw new Error('QRIS belum berhasil dibuat. Silakan coba lagi.')
        }
      }

      writeLastOrder(nextOrder)
      checkoutTransitionRef.current = true

      if (String(selectedMethod).toUpperCase() === 'CASH') {
        clearCart()
        navigate(`/success/cash/${nextOrder.orderId}`, { replace: true, state: { order: nextOrder } })
      } else {
        clearCart()
        navigate(`/payment/qris/${nextOrder.orderId}`, { replace: true, state: { order: nextOrder } })
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

  if (checking) {
    return <LoadingScreen label="Memeriksa pembayaran..." />
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
            remainingSeconds={paymentRemainingSeconds}
            onCheck={() => requestPaymentStatus({ manual: true })}
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
