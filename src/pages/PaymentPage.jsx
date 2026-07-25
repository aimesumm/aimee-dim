
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PaymentStatusCard from '../components/PaymentStatusCard'
import { checkPayment, createQris, getOrderStatus } from '../services/paymentGateway'
import { currency, getStatusLabel } from '../data/siteConfig'
import { supabaseBrowser } from '../lib/supabaseClient'
import { normalizeOrder, readLastOrder, writeLastOrder } from '../lib/orderHelpers'

const QRIS_TTL_MS = 10 * 60 * 1000
const POLL_INTERVAL_MS = 3000

function timeLeft(expiresAt, referenceTime = Date.now()) {
  if (!expiresAt) return ''
  const diff = Math.max(0, new Date(expiresAt).getTime() - referenceTime)
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function PaymentPage() {
  const { method: routeMethod, orderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const initialOrder = useMemo(() => {
    const stateOrder = location.state?.order || readLastOrder()
    if (stateOrder?.orderId && String(stateOrder.orderId) === String(orderId)) return normalizeOrder(stateOrder)
    return null
  }, [location.state, orderId])

  const [order, setOrder] = useState(() => initialOrder || null)
  const [bootstrapping, setBootstrapping] = useState(Boolean(orderId && !initialOrder))
  const [bootstrapError, setBootstrapError] = useState('')
  const [checking, setChecking] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [checkAttempts, setCheckAttempts] = useState(0)
  const [lastCheckedStatus, setLastCheckedStatus] = useState(String(initialOrder?.paymentStatus || initialOrder?.status || 'pending').toLowerCase())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!order && !orderId) {
      navigate('/order', { replace: true })
    }
  }, [order, orderId, navigate])

  useEffect(() => {
    let cancelled = false

    const loadInitialOrder = async () => {
      if (order || !orderId) return
      try {
        const latest = await getOrderStatus(orderId)
        if (!cancelled && latest?.orderId) {
          const normalized = normalizeOrder(latest)
          const status = String(normalized.paymentStatus || normalized.status || 'pending').toLowerCase()
          setOrder(normalized)
          setLastCheckedStatus(status)
          writeLastOrder(normalized)
          if (status !== 'pending') {
            navigate(`/success/${String(normalized.paymentMethod || normalized.method || routeMethod || 'qris').toLowerCase()}/${normalized.orderId}`, { replace: true, state: { order: normalized } })
          }
        }
      } catch (err) {
        if (!cancelled) setBootstrapError(err.message || 'Gagal memuat order.')
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    }

    loadInitialOrder()
    return () => {
      cancelled = true
    }
  }, [order, orderId])

  useEffect(() => {
    if (!order?.orderId || String(order.paymentStatus || order.status || '').toLowerCase() === 'completed') return

    const poll = setInterval(async () => {
      try {
        const latest = await getOrderStatus(order.orderId)
        if (latest?.orderId) {
          const normalized = normalizeOrder(latest, order)
          setOrder(normalized)
          writeLastOrder(normalized)
          const status = String(normalized.paymentStatus || normalized.status || 'pending').toLowerCase()
          setLastCheckedStatus(status)
          if (status !== 'pending') {
            const method = String(normalized.paymentMethod || normalized.method || routeMethod || 'qris').toLowerCase()
            navigate(`/success/${method}/${normalized.orderId}`, { replace: true, state: { order: normalized } })
          }
          setBootstrapping(false)
        }
      } catch {
        // keep silent, polling will retry
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(poll)
  }, [order, navigate, routeMethod])

  useEffect(() => {
    if (!supabaseBrowser || !order?.orderId) return

    const channel = supabaseBrowser
      .channel(`orders:${order.orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `order_id=eq.${order.orderId}`,
        },
        async () => {
          try {
            const latest = await getOrderStatus(order.orderId)
            if (latest?.orderId) {
              const normalized = normalizeOrder(latest, order)
              setOrder(normalized)
              writeLastOrder(normalized)
              const status = String(normalized.paymentStatus || normalized.status || 'pending').toLowerCase()
              setLastCheckedStatus(status)
              if (status !== 'pending') {
                const method = String(normalized.paymentMethod || normalized.method || routeMethod || 'qris').toLowerCase()
                navigate(`/success/${method}/${normalized.orderId}`, { replace: true, state: { order: normalized } })
              }
              setBootstrapping(false)
            }
          } catch {
            // fallback to polling
          }
        },
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [order?.orderId, navigate, routeMethod])

  useEffect(() => {
    const ensureQris = async () => {
      if (!order?.orderId) return
      if ((routeMethod || '').toLowerCase() !== 'qris') return
      if (order.qris?.link_qris) return
      setGenerating(true)
      setError('')
      try {
        const qris = await createQris({ orderId: order.orderId, total: order.total })
        const nextOrder = normalizeOrder({
          ...order,
          qris,
        }, order)
        setOrder(nextOrder)
        writeLastOrder(nextOrder)
        setBootstrapping(false)
      } catch (err) {
        setError(err.message || 'Gagal generate QR.')
      } finally {
        setGenerating(false)
      }
    }

    ensureQris()
  }, [order?.orderId, routeMethod])

  const goSuccess = (payload) => {
    const method = String(payload.paymentMethod || payload.method || routeMethod || 'qris').toLowerCase()
    navigate(`/success/${method}/${payload.orderId}`, { replace: true, state: { order: payload } })
  }

  const goFailed = (payload) => {
    navigate(`/payment-failed/${payload.orderId}`, { replace: true, state: { order: payload } })
  }

  const onCheck = async () => {
    if (!order?.orderId) return
    setChecking(true)
    setError('')
    try {
      const latest = await checkPayment(order.orderId)
      if (latest?.orderId) {
        const normalized = normalizeOrder(latest, order)
        const status = String(normalized.paymentStatus || normalized.status || 'pending').toLowerCase()
        const previous = String(lastCheckedStatus || 'pending').toLowerCase()

        setOrder(normalized)
        writeLastOrder(normalized)
        setLastCheckedStatus(status)

        if (status !== 'pending') {
          goSuccess(normalized)
          return
        }

        const hasChanged = status !== previous
        const nextAttempts = hasChanged ? checkAttempts : checkAttempts + 1
        setCheckAttempts(nextAttempts)
        if (nextAttempts >= 3) {
          goFailed(normalized)
        }
      }
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
      const qris = await createQris({ orderId: order.orderId, total: order.total })
      const next = normalizeOrder({ ...order, qris }, order)
      setOrder(next)
      writeLastOrder(next)
    } catch (err) {
      setError(err.message || 'Gagal generate QR.')
    } finally {
      setGenerating(false)
    }
  }

  if (bootstrapping && !order?.orderId) {
    return (
      <div className="app-shell">
        <main className="container payment-gateway-page">
          <div className="payment-loader-box">
            <div className="loading-spinner" />
            <strong>Memuat status pembayaran...</strong>
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
            <p>{bootstrapError || 'Silakan kembali ke checkout dan coba lagi.'}</p>
            <button className="primary-btn" type="button" onClick={() => navigate('/order', { replace: true })}>
              Kembali ke Order
            </button>
          </div>
        </main>
      </div>
    )
  }

  const isQris = (routeMethod || order.paymentMethod || order.method || '').toUpperCase() === 'QRIS'
  const expiresAt = order.qris?.expiresAt || (order.createdAt ? new Date(new Date(order.createdAt).getTime() + QRIS_TTL_MS).toISOString() : '')
  const qrisCountdown = expiresAt ? timeLeft(expiresAt, now) : ''
  const attemptsLeft = Math.max(0, 3 - checkAttempts)

  return (
    <div className="app-shell">
      <main className="container payment-gateway-page">
        <PaymentStatusCard
          order={order}
          variant={isQris ? 'qris' : 'cash'}
          onCheck={onCheck}
          checking={checking}
          statusText={getStatusLabel(order.paymentStatus || order.status)}
        >
          {isQris ? (
            <div className="payment-body-grid">
              {generating ? (
                <div className="payment-loader-box">
                  <div className="loading-spinner" />
                  <strong>Sedang membuat QRIS...</strong>
                  <p>Menunggu respons API converter QRIS.</p>
                </div>
              ) : order.qris?.link_qris ? (
                <div className="qris-preview">
                  <img src={order.qris.link_qris} alt="QRIS pembayaran" className="qris-image" />
                  <div className="qris-meta">
                    <div className="summary-row"><span>Nominal</span><strong>{currency.format(Number(order.qris.nominal ?? order.total ?? 0))}</strong></div>
                    <div className="summary-row"><span>Status API</span><strong>{order.qris.status || 'success'}</strong></div>
                    <div className="summary-row"><span>Data convert</span><strong>{order.qris.converted_qris ? 'Tersimpan' : '-'}</strong></div>
                    {qrisCountdown ? <div className="summary-row"><span>Expired</span><strong>{qrisCountdown}</strong></div> : null}
                  </div>
                </div>
              ) : (
                <div className="payment-error-box">
                  <strong>Gagal generate QRIS</strong>
                  <p>{error || 'QR belum tersedia.'}</p>
                  <button className="primary-btn" type="button" onClick={retryQris} disabled={generating}>
                    Coba Lagi
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="cash-panel-copy">
              <div className="cash-icon">💵</div>
              <p>Silakan lakukan pembayaran kepada kasir.</p>
              <p>Status saat ini: {getStatusLabel(order.paymentStatus || order.status)}</p>
            </div>
          )}

          {error ? <div className="notice error">{error}</div> : null}

          <div className="notice warning">
            {attemptsLeft > 0 ? `🟡 Menunggu Konfirmasi Owner • sisa cek manual: ${attemptsLeft}` : '🟡 Menunggu Konfirmasi Owner'}
          </div>
        </PaymentStatusCard>
      </main>
    </div>
  )
}
