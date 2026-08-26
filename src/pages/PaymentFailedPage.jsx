
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { currency, formatOrderTime, getMethodLabel, getStatusLabel, pickupPoint } from '../data/siteConfig'
import { normalizeOrder, readLastOrder, writeLastOrder } from '../lib/orderHelpers'

function MapPreview() {
  return (
    <a className="map-preview failed-map" href={pickupPoint.map} target="_blank" rel="noreferrer">
      <div className="map-preview-top">
        <span className="map-pin">📍</span>
        <div>
          <strong>{pickupPoint.name}</strong>
          <p>{pickupPoint.detail}</p>
        </div>
      </div>
      <div className="map-mini-grid" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="map-preview-footer">{pickupPoint.note}</div>
    </a>
  )
}

export default function PaymentFailedPage() {
  const { orderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [order, setOrder] = useState(() => {
    const initial = normalizeOrder(location.state?.order || readLastOrder())
    return initial && String(initial.orderId) === String(orderId) ? initial : null
  })

  useEffect(() => {
    if (!order?.orderId) {
      navigate('/order', { replace: true })
    }
  }, [order, orderId, navigate])

  if (!order?.orderId) return null

  return (
    <div className="app-shell">
      <main className="container checkout-only-page">
        <motion.section
          className="payment-panel failure-panel glass-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="success-hero">
            <p className="eyebrow">Pembayaran gagal</p>
            <h2>QRIS sudah kedaluwarsa</h2>
            <p className="qris-note">
              Order ID {orderId || order.orderId} • {getMethodLabel(order.method)} • {formatOrderTime(order.time)}
            </p>
            <div className="payment-total">{currency.format(Number(order.total || 0))}</div>
          </div>

          <div className="notice error">
            QRIS sudah melewati batas waktu pembayaran. Tidak ada konfirmasi manual yang diperlukan. Silakan buat pesanan baru untuk mendapatkan QRIS aktif.
          </div>

          <MapPreview />

          <div className="failure-actions">
            <button className="primary-btn" type="button" onClick={() => navigate('/order', { replace: true })}>
              Buat Pesanan Baru
            </button>
          </div>

          <div className="summary-stack failure-summary">
            <div className="summary-row"><span>Status</span><strong>{getStatusLabel(order.status)}</strong></div>
            <div className="summary-row"><span>Metode</span><strong>{getMethodLabel(order.method)}</strong></div>
            <div className="summary-row"><span>Waktu</span><strong>{formatOrderTime(order.time)}</strong></div>
          </div>
        </motion.section>
      </main>
    </div>
  )
}
