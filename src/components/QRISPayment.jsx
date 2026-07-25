import React from 'react'
import { motion } from 'framer-motion'
import { currency, getStatusLabel, getMethodLabel } from '../data/siteConfig'
import OrderSummary from './OrderSummary'

export default function QRISPayment({ order, qrisData, onCheck, onRegenerate, checking = false }) {
  const qrisImage = qrisData?.qrisImage || qrisData?.qris || qrisData?.image || qrisData?.url || ''

  return (
    <motion.div
      className="payment-panel qris-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="payment-hero">
        <div>
          <p className="eyebrow">QRIS dinamis</p>
          <h3>Scan kode berikut untuk membayar</h3>
          <p className="qris-note">
            Status awal: {getStatusLabel(order.status)} • Metode: {getMethodLabel(order.method)}
          </p>
        </div>
        <div className="payment-total">{currency.format(Number(order.total || 0))}</div>
      </div>

      <div className="qris-image-wrap">
        {qrisImage ? <img src={qrisImage} alt="QRIS AIME-Dimsum" className="qris-image" /> : <div className="qris-placeholder">QRIS sedang dibuat...</div>}
      </div>

      <div className="action-row">
        <button className="primary-btn" onClick={onCheck} disabled={checking}>
          {checking ? 'Mengecek...' : 'Cek Pembayaran'}
        </button>
        {onRegenerate ? (
          <button className="ghost-btn" onClick={onRegenerate} type="button">
            Buat Ulang QRIS
          </button>
        ) : null}
      </div>

      <OrderSummary order={order} />
    </motion.div>
  )
}
