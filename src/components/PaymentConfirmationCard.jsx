import React from 'react'
import { motion } from 'framer-motion'
import { currency, getMethodLabel, getStatusLabel } from '../data/siteConfig'
import OrderSummary from './OrderSummary'

function QrisPreview({ qris, orderId, total, countdown, generating, error, onRetry }) {
  const nominal = Number(qris?.nominal ?? total ?? 0)

  if (!qris?.link_qris) {
    if (generating) {
      return (
        <div className="confirm-qris-box">
          <div className="payment-loader-box">
            <div className="loading-spinner" />
            <strong>Sedang membuat QRIS...</strong>
            <p>Menunggu respons API converter QRIS.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="confirm-qris-box">
        <div className="payment-error-box">
          <strong>Gagal generate QRIS</strong>
          <p>{error || 'QR belum tersedia.'}</p>
          <button className="primary-btn" type="button" onClick={onRetry} disabled={generating}>
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="confirm-qris-box">
      <div className="confirm-qris-image-wrap">
        <img src={qris.link_qris} alt="QRIS pembayaran" className="confirm-qris-image" />
      </div>

      <div className="confirm-qris-meta">
        <div className="summary-row"><span>UID</span><strong>{orderId || '-'}</strong></div>
        <div className="summary-row"><span>Total bayar</span><strong>{currency.format(nominal)}</strong></div>
        <div className="summary-row"><span>Status QRIS</span><strong>{qris?.status || 'success'}</strong></div>
        {countdown ? <div className="summary-row"><span>Sisa waktu</span><strong>{countdown}</strong></div> : null}
      </div>
    </div>
  )
}

function CashPreview({ orderId, total }) {
  return (
    <div className="cash-confirm-box">
      <div className="cash-confirm-badge">💵</div>
      <h3>Menunggu konfirmasi pesanan</h3>
      <p>Silakan tunggu admin mengonfirmasi pesanan Anda melalui Telegram.</p>
      <div className="summary-row"><span>UID</span><strong>{orderId || '-'}</strong></div>
      <div className="summary-row"><span>Total bayar</span><strong>{currency.format(Number(total || 0))}</strong></div>
    </div>
  )
}

export default function PaymentConfirmationCard({
  order,
  isQris,
  attemptsLeft,
  checking,
  onConfirm,
  qris,
  countdown,
  generating,
  qrisError,
  onRetryQris,
  children,
}) {
  const paymentStatus = String(order?.paymentStatus || order?.status || 'pending').toLowerCase()

  return (
    <motion.section
      className="payment-confirmation-card glass-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="payment-confirmation-head">
        <div>
          <p className="eyebrow">Complete Payment</p>
          <h1>Konfirmasi pesanan</h1>
          <p className="section-copy">
            Order ID {order?.orderId || '-'} • {getMethodLabel(order?.paymentMethod || order?.method || (isQris ? 'QRIS' : 'CASH'))} • {getStatusLabel(paymentStatus)}
          </p>
        </div>
        <div className="status-total">{currency.format(Number(order?.total || 0))}</div>
      </div>

      <div className="confirm-customer-box">
        <div className="summary-row"><span>Customer information</span><strong>{order?.customerName || order?.name || '-'}</strong></div>
        <div className="summary-row"><span>Nomor WhatsApp</span><strong>{order?.customerPhone || order?.customer_phone || order?.phone || order?.whatsapp || '-'}</strong></div>
        <div className="summary-row"><span>Email</span><strong>{order?.customerEmail || order?.customer_email || order?.email || '-'}</strong></div>
        <div className="summary-row"><span>Catatan</span><strong>{order?.note || order?.customerNote || '-'}</strong></div>
      </div>

      <OrderSummary order={order} />

      {isQris ? (
        <QrisPreview
          qris={qris}
          orderId={order?.orderId}
          total={order?.total}
          countdown={countdown}
          generating={generating}
          error={qrisError}
          onRetry={onRetryQris}
        />
      ) : (
        <CashPreview orderId={order?.orderId} total={order?.total} />
      )}

      <div className="confirm-actions">
        <button className="primary-btn checkout-continue confirm-order-btn" type="button" onClick={onConfirm} disabled={checking || attemptsLeft <= 0}>
          {checking ? 'Mengecek...' : attemptsLeft > 0 ? `Konfirmasi Pesanan (${attemptsLeft})` : 'Tiket habis'}
        </button>
      </div>

      {children}
    </motion.section>
  )
}
