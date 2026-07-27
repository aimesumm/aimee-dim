
import React from 'react'
import { motion } from 'framer-motion'
import { currency, formatOrderTime, getMethodLabel, getStatusLabel, pickupPoint } from '../data/siteConfig'
import OrderSummary from './OrderSummary'
import GiveOrderButton from './GiveOrderButton'

function MapPreview() {
  return (
    <a className="map-preview" href={pickupPoint.map} target="_blank" rel="noreferrer">
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

export default function PaymentSuccess({ order, variant = 'qris' }) {
  const paymentMethod = String(order?.paymentMethod || order?.method || variant || '').toUpperCase()
  const isPaid = String(order?.paymentStatus || order?.status || '').toLowerCase() === 'paid'

  return (
    <motion.div
      className={`payment-panel success-panel success-${variant}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="success-hero">
        <p className="eyebrow">{paymentMethod === 'CASH' ? 'Pembayaran tunai berhasil' : 'Pembayaran QRIS berhasil'}</p>
        <h2>{isPaid ? getStatusLabel(order.status) : 'Status berhasil diperbarui'}</h2>
        <p className="qris-note">
          Order ID {order.orderId} • {getMethodLabel(order.method)} • {formatOrderTime(order.time)}
        </p>
        <div className="payment-total">{currency.format(Number(order.total || 0))}</div>
      </div>

      <OrderSummary order={order} />

      <div className="success-extras">
        <MapPreview />
        <div className="success-note">
          <strong>Langkah berikutnya</strong>
          <p>Tekan tombol dibawah ini untuk mengirim pesanan yang sudah kamu order.</p>
        </div>
      </div>

      <div className="action-row">
        <GiveOrderButton order={order} />
      </div>
    </motion.div>
  )
}
