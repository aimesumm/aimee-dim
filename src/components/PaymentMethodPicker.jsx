import React from 'react'
import { motion } from 'framer-motion'

const METHODS = [
  { value: 'QRIS', title: 'QRIS' },
  { value: 'CASH', title: 'Tunai' },
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

      <div className="payment-option-grid payment-option-grid-simple">
        {METHODS.map((method) => (
          <label key={method.value} className={value === method.value ? 'payment-option active' : 'payment-option'}>
            <input
              type="radio"
              name="payment-method"
              value={method.value}
              checked={value === method.value}
              onChange={() => onChange(method.value)}
            />
            <span className="payment-option-title">{method.title}</span>
          </label>
        ))}
      </div>

      <button className="primary-btn checkout-continue" type="button" onClick={onContinue} disabled={loading}>
        {loading ? 'Memproses...' : 'Lanjutkan'}
      </button>
    </motion.div>
  )
}
