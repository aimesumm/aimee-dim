import React from 'react'
import { motion } from 'framer-motion'
import { ORDER_STATUS_STEPS, currency, formatOrderTime, getMethodLabel, getStatusLabel } from '../data/siteConfig'

function stepIndex(status) {
  return Math.max(0, ORDER_STATUS_STEPS.indexOf(String(status || '').toLowerCase()))
}

export default function PaymentWaiting({ order, onCheck, checking = false }) {
  const current = stepIndex(order.status)

  return (
    <motion.div
      className="payment-panel waiting-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="payment-hero">
        <div>
          <p className="eyebrow">Status transaksi</p>
          <h3>{getStatusLabel(order.status)}</h3>
          <p className="qris-note">Order ID: {order.orderId}</p>
        </div>
        <div className="payment-total">{currency.format(Number(order.total || 0))}</div>
      </div>

      <div className="timeline">
        {ORDER_STATUS_STEPS.map((step, index) => (
          <div key={step} className={index <= current ? 'timeline-step active' : 'timeline-step'}>
            <span className="timeline-dot">{index + 1}</span>
            <div>
              <strong>{getStatusLabel(step)}</strong>
              <small>{index === 0 ? 'Menunggu pembayaran' : index === 1 ? 'Owner akan mengonfirmasi' : index === 2 ? 'Transaksi sudah valid' : 'Pesanan selesai'}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="summary-stack">
        <div className="summary-row"><span>Nama customer</span><strong>{order.name}</strong></div>
        <div className="summary-row"><span>Nomor customer</span><strong>{order.phone}</strong></div>
        <div className="summary-row"><span>Metode pembayaran</span><strong>{getMethodLabel(order.method)}</strong></div>
        <div className="summary-row"><span>Waktu transaksi</span><strong>{formatOrderTime(order.time)}</strong></div>
      </div>

      <button className="ghost-btn" onClick={onCheck} disabled={checking}>
        {checking ? 'Mengecek status...' : 'Cek Pembayaran'}
      </button>
    </motion.div>
  )
}
