import React from 'react'
import { motion } from 'framer-motion'
import { currency } from '../data/siteConfig'

export default function CashPayment({ order, onPay }) {
  return (
    <motion.div
      className="payment-panel cash-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="payment-hero">
        <div>
          <p className="eyebrow">Bayar tunai</p>
          <h3>Pesanan akan menunggu konfirmasi owner</h3>
          <p className="qris-note">Setelah owner menekan tombol konfirmasi di Telegram, status berubah menjadi selesai.</p>
        </div>
        <div className="payment-total">{currency.format(Number(order.total || 0))}</div>
      </div>

      <div className="cash-note">
        Bayar langsung ke owner saat pesanan sudah disiapkan. Tidak ada WhatsApp sebelum konfirmasi.
      </div>

      <button className="primary-btn" onClick={onPay}>Buat Pesanan Tunai</button>
    </motion.div>
  )
}
