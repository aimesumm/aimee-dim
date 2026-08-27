import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { currency } from '../data/siteConfig'

function PhoneIcon() {
  return (
    <span className="klikqris-how-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <rect x="7" y="2.8" width="10" height="18.4" rx="2.2" />
        <path d="M10.5 5.5h3" />
        <circle cx="12" cy="18" r=".8" />
      </svg>
    </span>
  )
}

function WalletIcon() {
  return (
    <span className="klikqris-how-icon muted" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <rect x="4" y="5" width="16" height="14" rx="2.5" />
        <path d="M4 8h16" />
        <path d="M15 13h5" />
        <circle cx="15.5" cy="13" r=".8" />
      </svg>
    </span>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M5 19h14" />
    </svg>
  )
}

function getQrisSource(qris) {
  return String(qris?.qris_image || qris?.qris_url || '').trim()
}

function formatCountdown(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0)
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

async function downloadSource(source, fileName) {
  if (!source) return

  try {
    if (source.startsWith('data:image')) {
      const anchor = document.createElement('a')
      anchor.href = source
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      return
    }

    const response = await fetch(source, { mode: 'cors' })
    if (!response.ok) throw new Error('QRIS image could not be fetched')

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  } catch {
    window.open(source, '_blank', 'noopener,noreferrer')
  }
}

function HowToPay() {
  return (
    <section className="klikqris-how-to" aria-labelledby="how-to-pay-title">
      <h2 id="how-to-pay-title" className="klikqris-how-title">How to Pay:</h2>

      <div className="klikqris-how-tabs">
        <div className="klikqris-how-tab active">
          <PhoneIcon />
          <div>
            <strong>Pay with the same phone</strong>
          </div>
        </div>
        <div className="klikqris-how-divider" aria-hidden="true" />
        <div className="klikqris-how-tab muted">
          <WalletIcon />
          <div>
            <strong>Pay with other phone</strong>
          </div>
        </div>
      </div>

      <div className="klikqris-how-step">
        <span>1</span>
        <p><strong>Screenshot</strong> the QRIS code</p>
      </div>
      <div className="klikqris-how-step">
        <span>2</span>
        <p><strong>Open QR payment</strong> in your m-banking or e-wallet</p>
      </div>
      <div className="klikqris-how-step">
        <span>3</span>
        <p>Choose the <strong>QRIS/Scan</strong> menu, scan the code, and check the amount.</p>
      </div>
      <div className="klikqris-how-step">
        <span>4</span>
        <p>Finish the payment. <strong>No manual confirmation needed</strong> — the status is checked automatically.</p>
      </div>
    </section>
  )
}

function QrisLoading({ generating, error }) {
  return (
    <div className="klikqris-empty-state">
      <div className="loading-spinner" />
      <strong>{generating ? 'Menyiapkan QRIS pembayaran...' : 'QRIS sedang diproses...'}</strong>
      <p>{error || 'Mohon tunggu sebentar. Kami sedang menghubungkan transaksi ke KlikQRIS.'}</p>
    </div>
  )
}

export default function KlikQrisPaymentCard({
  order,
  qris,
  checking,
  generating,
  qrisError,
  remainingSeconds = 0,
  onCheck,
}) {
  const source = getQrisSource(qris)
  const amount = Number(qris?.total_amount ?? order?.total ?? 0)
  const [downloadBusy, setDownloadBusy] = useState(false)

  const status = String(qris?.status || order?.paymentStatus || 'PENDING').toUpperCase()
  const isExpired = status === 'EXPIRED'
  const fileName = `QRIS-AimeYummy-${order?.orderId || 'payment'}.png`

  const handleDownload = async () => {
    if (!source || downloadBusy) return
    setDownloadBusy(true)
    try {
      await downloadSource(source, fileName)
    } finally {
      setDownloadBusy(false)
    }
  }

  return (
    <motion.section
      className="klikqris-payment-shell"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {!source ? (
        <QrisLoading generating={generating} error={qrisError} />
      ) : (
        <>
          <div className="klikqris-qr-stage">
            <div className="klikqris-countdown" aria-live="polite">
              <span>Complete payment in</span>
              <strong>{formatCountdown(remainingSeconds)}</strong>
            </div>
            <div className="klikqris-branding">
              <div className="klikqris-logo-line">
                <strong className="klikqris-logo-word">QRIS</strong>
                <span>QR Code Standar<br />Pembayaran Nasional</span>
              </div>
              <span className="klikqris-gpn">GPN</span>
              <strong className="klikqris-merchant-name">AimeYummy</strong>
            </div>
            <span className="klikqris-qr-ribbon klikqris-qr-ribbon-top" aria-hidden="true" />
            <div className="klikqris-qr-frame">
              <img src={source} alt={`QRIS pembayaran order ${order?.orderId || ''}`} />
            </div>
            <span className="klikqris-qr-ribbon klikqris-qr-ribbon-bottom" aria-hidden="true" />
          </div>

          <div className="klikqris-billing-card">
            <span>Payment Total</span>
            <strong>{currency.format(amount)}</strong>
          </div>

          <div className="klikqris-actions">
            <button
              className="klikqris-check-button"
              type="button"
              onClick={onCheck}
              disabled={checking || generating || isExpired}
            >
              {checking ? 'Memeriksa pembayaran...' : 'Check Status'}
            </button>
            <button
              className="klikqris-download-button"
              type="button"
              onClick={handleDownload}
              disabled={downloadBusy}
              aria-label="Download QRIS"
              title="Download QRIS"
            >
              <DownloadIcon />
            </button>
          </div>

          {checking ? (
            <div className="klikqris-status-loading" role="status" aria-live="polite">
              <div className="loading-spinner" />
              <strong>Memeriksa status pembayaran...</strong>
              <span>Mohon tunggu, halaman akan diperbarui otomatis.</span>
            </div>
          ) : null}

          {qrisError ? <div className="notice error klikqris-error">{qrisError}</div> : null}
        </>
      )}

      <HowToPay />
    </motion.section>
  )
}
