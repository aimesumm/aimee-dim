import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { currency } from '../data/siteConfig'
import OrderSummary from './OrderSummary'

function PhoneIcon() {
  return <span className="how-to-icon">⌁</span>
}

function WalletIcon() {
  return <span className="how-to-icon">▣</span>
}

function DownloadIcon() {
  return <span aria-hidden="true">⇩</span>
}

function getQrisSource(qris) {
  return qris?.qris_url || qris?.qris_image || ''
}

function getFileName(orderId) {
  return `QRIS-${orderId || 'AIME-Dimsum'}.png`
}

function QrisPreview({ qris, orderId, total, generating, error, onRetry }) {
  const source = getQrisSource(qris)
  const amount = Number(qris?.total_amount ?? total ?? 0)
  const expiresAt = useMemo(() => qris?.expired_at ? new Date(qris.expired_at.replace(' ', 'T')).getTime() : 0, [qris?.expired_at])
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  if (!source) {
    return (
      <div className="qris-payment-card">
        <div className="payment-loader-box">
          {generating ? (
            <>
              <div className="loading-spinner" />
              <strong>Membuat QRIS dinamis...</strong>
              <p>QRIS sedang dibuat oleh KlikQRIS.</p>
            </>
          ) : (
            <>
              <strong>QRIS belum tersedia</strong>
              <p>{error || 'Terjadi kendala saat membuat kode pembayaran.'}</p>
              <button className="primary-btn" type="button" onClick={onRetry} disabled={generating}>Coba Lagi</button>
            </>
          )}
        </div>
      </div>
    )
  }

  const isDataImage = source.startsWith('data:image')
  const downloadSource = source
  const readableExpiry = expiresAt
    ? new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(expiresAt)
    : '-'
  const remainingMs = Math.max(0, expiresAt - now)
  const remainingMinutes = Math.floor(remainingMs / 60000)
  const remainingSeconds = Math.floor((remainingMs % 60000) / 1000)
  const remainingLabel = expiresAt ? `${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}` : '-'

  return (
    <div className="qris-payment-card">
      <div className="qris-brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="qris-scan-label">SCAN QRIS UNTUK MEMBAYAR</div>
      <div className="qris-image-frame">
        <img src={source} alt="QRIS pembayaran AIME-Dimsum" className="confirm-qris-image" />
      </div>

      <div className="qris-amount-block">
        <span>Jumlah Tagihan</span>
        <strong>{currency.format(amount)}</strong>
      </div>

      <div className="qris-payment-meta">
        <div><span>Metode Pembayaran</span><strong>QRIS</strong></div>
        <div><span>Status</span><strong>{qris?.status || 'PENDING'}</strong></div>
        <div><span>Berlaku sampai</span><strong>{readableExpiry}</strong></div>
        <div><span>Sisa waktu</span><strong>{remainingLabel}</strong></div>
      </div>

      <div className="qris-actions">
        <button className="primary-btn qris-check-btn" type="button" onClick={onRetry} disabled={generating} hidden={!error}>
          Buat Ulang QRIS
        </button>
        <a
          className="qris-download-btn"
          href={downloadSource}
          download={!isDataImage ? getFileName(orderId) : getFileName(orderId)}
          target="_blank"
          rel="noreferrer"
          aria-label="Download QRIS"
        >
          <DownloadIcon />
        </a>
      </div>
    </div>
  )
}

function HowToPay() {
  return (
    <section className="how-to-pay">
      <h3>How to Pay:</h3>
      <div className="how-to-tabs">
        <div className="how-to-tab active">
          <PhoneIcon />
          <strong>Pay with the same phone</strong>
        </div>
        <div className="how-to-divider" />
        <div className="how-to-tab muted">
          <WalletIcon />
          <strong>Pay with other phone</strong>
        </div>
      </div>

      <div className="how-to-step">
        <span className="how-to-step-badge">1</span>
        <p><strong>Screenshot</strong> the QRIS code.</p>
      </div>
      <div className="how-to-step">
        <span className="how-to-step-badge">2</span>
        <p><strong>Open QR payment</strong> di aplikasi mobile banking atau e-wallet.</p>
      </div>
      <div className="how-to-step">
        <span className="how-to-step-badge">3</span>
        <p>Scan / pilih QRIS pada aplikasi pembayaran, lalu pastikan <strong>nominal sesuai</strong>.</p>
      </div>
      <div className="how-to-step">
        <span className="how-to-step-badge">4</span>
        <p>Selesaikan pembayaran. Status order akan diperbarui <strong>otomatis</strong>.</p>
      </div>
    </section>
  )
}

export default function PaymentConfirmationCard({
  order,
  isQris,
  checking,
  onConfirm,
  qris,
  generating,
  qrisError,
  onRetryQris,
}) {
  return (
    <motion.section
      className="payment-confirmation-card glass-card klikqris-payment-shell"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="klikqris-payment-head">
        <p className="eyebrow">Pembayaran QRIS Dinamis</p>
        <h1>Bayar dengan QRIS</h1>
        <p>Gunakan mobile banking atau e-wallet pilihan Anda. Setelah pembayaran berhasil, halaman akan berpindah otomatis ke halaman sukses.</p>
      </div>

      <OrderSummary order={{ ...order, total: Number(qris?.total_amount ?? order?.total ?? 0) }} />

      {isQris ? <QrisPreview qris={qris} orderId={order?.orderId} total={order?.total} generating={generating} error={qrisError} onRetry={onRetryQris} /> : null}

      <button className="primary-btn qris-status-button" type="button" onClick={onConfirm} disabled={checking || generating}>
        {checking ? 'Checking Payment Status...' : 'Check Payment Status'}
      </button>

      {qrisError ? <div className="notice error">{qrisError}</div> : null}

      <HowToPay />
    </motion.section>
  )
}
