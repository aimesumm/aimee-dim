import React from 'react'
import { motion } from 'framer-motion'

export default function PaymentSuccessTransition({ orderId }) {
  return (
    <motion.div
      className="payment-success-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="status"
      aria-live="polite"
    >
      <motion.div
        className="payment-success-transition-card"
        initial={{ opacity: 0, scale: 0.88, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      >
        <motion.div
          className="payment-success-check"
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 220, damping: 15 }}
        >
          <motion.svg viewBox="0 0 52 52" aria-hidden="true">
            <motion.circle
              cx="26"
              cy="26"
              r="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.55, delay: 0.15 }}
            />
            <motion.path
              d="m16 27 6.5 6.5L37 19"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.45 }}
            />
          </motion.svg>
        </motion.div>
        <p className="eyebrow">Pembayaran berhasil</p>
        <h2>Terima kasih! 🎉</h2>
        <p>Pesanan kamu sudah terverifikasi otomatis dan siap diproses.</p>
        <span>Order ID: {orderId || '-'}</span>
      </motion.div>
    </motion.div>
  )
}
