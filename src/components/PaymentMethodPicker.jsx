
import React from 'react'
import { motion } from 'framer-motion'

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

      <div className="choice-stack">
        <button
          type="button"
          className={value === 'QRIS' ? 'choice active' : 'choice'}
          onClick={() => onChange('QRIS')}
        >
          <strong>QRIS</strong>
          <span>Dinamis, cepat, dan langsung terhubung ke alur pembayaran.</span>
        </button>
        <button
          type="button"
          className={value === 'CASH' ? 'choice active' : 'choice'}
          onClick={() => onChange('CASH')}
        >
          <strong>Tunai</strong>
          <span>Pesanan masuk dulu, lalu owner mengonfirmasi dari Telegram.</span>
        </button>
      </div>

      <button className="primary-btn checkout-continue" type="button" onClick={onContinue} disabled={loading}>
        {loading ? 'Memproses...' : 'Lanjutkan'}
      </button>
    </motion.div>
  )
}
