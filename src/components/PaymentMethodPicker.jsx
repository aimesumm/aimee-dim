import React from 'react'
import { motion } from 'framer-motion'

function QrisIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h7v7h-7z" />
    </svg>
  )
}

function CashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 9.5h2M16 14.5h2" />
    </svg>
  )
}

const METHODS = [
  { value: 'QRIS', title: 'QRIS', desc: 'Bayar cepat dengan scan QR', icon: QrisIcon },
  { value: 'CASH', title: 'Tunai', desc: 'Bayar langsung ke kasir', icon: CashIcon },
]

export default function PaymentMethodPicker({ value, onChange, onContinue, loading, customer = {} }) {
  return (
    <motion.section
      className="payment-method-picker glass-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="section-head compact">
        <div>
          <p className="eyebrow">Complete Payment</p>
          <h2>Pilih QRIS atau tunai</h2>
          <p className="section-copy">Data customer di bawah akan ikut terkirim ke backend dan ke admin untuk konfirmasi.</p>
        </div>
      </div>

      <div className="payment-customer-summary">
        <div className="summary-row"><span>Nama</span><strong>{customer.name || '-'}</strong></div>
        <div className="summary-row"><span>Nomor</span><strong>{customer.phone || '-'}</strong></div>
        <div className="summary-row"><span>Email</span><strong>{customer.email || '-'}</strong></div>
      </div>

      <div className="payment-option-grid payment-option-grid-simple">
        {METHODS.map((method) => {
          const Icon = method.icon
          const checked = value === method.value
          return (
            <label key={method.value} className={checked ? 'payment-option active' : 'payment-option'}>
              <input
                type="radio"
                name="payment-method"
                value={method.value}
                checked={checked}
                onChange={() => onChange(method.value)}
              />
              <span className="payment-option-icon" aria-hidden="true">
                <Icon />
              </span>
              <span className="payment-option-copy">
                <span className="payment-option-title">{method.title}</span>
                <span className="payment-option-desc">{method.desc}</span>
              </span>
              <span className="payment-option-radio" aria-hidden="true">
                <span />
              </span>
            </label>
          )
        })}
      </div>

      <button className="primary-btn checkout-continue" type="button" onClick={onContinue} disabled={loading}>
        {loading ? 'Memproses...' : 'Complete Payment'}
      </button>
    </motion.section>
  )
}
