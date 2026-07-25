
import React from 'react'
import { motion } from 'framer-motion'

const METHODS = [
  {
    value: 'QRIS',
    title: 'QRIS',
    icon: '⬛',
    desc: 'Cepat, modern, dan langsung masuk ke alur pembayaran.',
  },
  {
    value: 'CASH',
    title: 'Tunai',
    icon: '💵',
    desc: 'Pesanan dikonfirmasi owner setelah pembayaran diterima.',
  },
]

export default function PaymentMethodPicker({ value, onChange, onContinue, loading }) {
  return (
    <motion.div
      className="payment-method-picker glass-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="section-head compact">
        <div>
          <p className="eyebrow">Checkout</p>
          <h2>Pilih metode pembayaran</h2>
        </div>
      </div>

      <div className="payment-option-grid">
        {METHODS.map((method) => (
          <label key={method.value} className={value === method.value ? 'payment-option active' : 'payment-option'}>
            <input
              type="radio"
              name="payment-method"
              value={method.value}
              checked={value === method.value}
              onChange={() => onChange(method.value)}
            />
            <span className="payment-option-icon" aria-hidden="true">{method.icon}</span>
            <span className="payment-option-copy">
              <strong>{method.title}</strong>
              <small>{method.desc}</small>
            </span>
          </label>
        ))}
      </div>

      <button className="primary-btn checkout-continue" type="button" onClick={onContinue} disabled={loading}>
        {loading ? 'Memproses...' : 'Lanjutkan'}
      </button>
    </motion.div>
  )
}
