import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { currency } from '../data/siteConfig'

function PhoneIcon({ muted = false }) {
  return (
    <span className={`klikqris-how-icon${muted ? ' muted' : ''}`} aria-hidden="true">
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

function parseKlikQrisDate(value) {
  if (!value) return 0
  const raw = String(value).trim()
  if (!raw) return 0

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  // KlikQRIS timestamps are returned without an offset. AIME-Dimsum operates in WITA.
  const withWitaOffset = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized) ? normalized : `${normalized}+08:00`
  const parsed = new Date(withWitaOffset).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatExpiry(value) {
  const timestamp = parseKlikQrisDate(value)
  if (!timestamp) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Makassar',
  }).format(timestamp)
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
      <div className="klikqris-section-title">
        <span className="klikqris-section-kicker">Panduan Pembayaran</span>
        <h2 id="how-to-pay-title">How to Pay</h2>
      </div>

      <div className="klikqris-how-tabs">
        <div className="klikqris-how-tab active">
          <PhoneIcon />
          <div>
            <strong>Bayar dengan HP yang sama</strong>
            <span>Screenshot QRIS lalu buka aplikasi pembayaran.</span>
          </div>
        </div>
        <div className="klikqris-how-divider" aria-hidden="true" />
        <div className="klikqris-how-tab muted">
          <WalletIcon />
          <div>
            <strong>Bayar dengan HP lain</strong>
            <span>Scan QRIS dari layar HP yang menampilkan kode.</span>
          </div>
        </div>
      </div>

      <div className="klikqris-how-step">
        <span>1</span>
        <p><strong>Screenshot</strong> QRIS yang tampil di halaman ini.</p>
      </div>
      <div className="klikqris-how-step">
        <span>2</span>
        <p><strong>Buka mobile banking atau e-wallet</strong> yang mendukung QRIS.</p>
      </div>
      <div className="klikqris-how-step">
        <span>3</span>
        <p>Pilih menu <strong>QRIS/Scan</strong>, lalu scan QRIS dan pastikan jumlah tagihan sesuai.</p>
      </div>
      <div className="klikqris-how-step">
        <span>4</span>
        <p>Selesaikan pembayaran. <strong>Tidak perlu konfirmasi manual</strong>; status akan diperiksa otomatis.</p>
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
  onCheck,
  nextCheckIn,
}) {
  const source = getQrisSource(qris)
  const amount = Number(qris?.total_amount ?? order?.total ?? 0)
  const expiresAt = useMemo(() => parseKlikQrisDate(qris?.expired_at), [qris?.expired_at])
  const [now, setNow] = useState(Date.now())
  const [downloadBusy, setDownloadBusy] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : 0
  const status = String(qris?.status || order?.paymentStatus || 'PENDING').toUpperCase()
  const isExpired = status === 'EXPIRED' || (expiresAt > 0 && remainingMs <= 0)
  const fileName = `QRIS-AIME-Dimsum-${order?.orderId || 'payment'}.png`

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
      <header className="klikqris-payment-head">
        <div className="klikqris-brand-badge">AIME-Dimsum • QRIS</div>
        <h1>Bayar lebih cepat, pesanan langsung diproses.</h1>
        <p>Scan QRIS di bawah dengan mobile banking atau e-wallet. Setelah pembayaran berhasil, sistem akan memverifikasi otomatis tanpa konfirmasi manual.</p>
      </header>

      <div className="klikqris-invoice-strip">
        <div>
          <span>Order ID</span>
          <strong>{order?.orderId || '-'}</strong>
        </div>
        <div>
          <span>Metode Pembayaran</span>
          <strong>QRIS</strong>
        </div>
      </div>

      {!source ? (
        <QrisLoading generating={generating} error={qrisError} />
      ) : (
        <>
          <div className="klikqris-qr-stage">
            <div className="klikqris-scan-label">SCAN QRIS UNTUK MEMBAYAR</div>
            <div className="klikqris-qr-frame">
              <img src={source} alt={`QRIS pembayaran order ${order?.orderId || ''}`} />
            </div>
            <p className="klikqris-qr-helper">Screenshot QRIS atau langsung scan menggunakan perangkat lain.</p>
          </div>

          <div className="klikqris-billing-card">
            <span>Jumlah Tagihan</span>
            <strong>{currency.format(amount)}</strong>
            <div className="klikqris-billing-row">
              <span>Status</span>
              <b className={`klikqris-status ${status.toLowerCase()}`}>{status === 'PENDING' ? 'Menunggu Pembayaran' : status === 'SUCCESS' ? 'Pembayaran Berhasil' : 'QRIS Kedaluwarsa'}</b>
            </div>
          </div>

          <div className="klikqris-time-card">
            <div className="klikqris-time-copy">
              <span>Waktu pembayaran</span>
              <strong>{isExpired ? '00:00' : formatCountdown(remainingMs)}</strong>
            </div>
            <div className="klikqris-time-meta">
              <span>Berakhir</span>
              <strong>{formatExpiry(qris?.expired_at)}</strong>
            </div>
          </div>

          <div className="klikqris-actions">
            <button
              className="primary-btn klikqris-check-button"
              type="button"
              onClick={onCheck}
              disabled={checking || generating || isExpired}
            >
              {checking ? 'Mengecek pembayaran...' : 'Check Payment Status'}
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

          <div className="klikqris-auto-check">
            <span className="klikqris-pulse-dot" aria-hidden="true" />
            <span>
              {isExpired
                ? 'Waktu pembayaran habis. Sistem akan memeriksa status terakhir transaksi.'
                : `Pengecekan otomatis berikutnya dalam ${Math.max(0, Number(nextCheckIn || 0))} detik.`}
            </span>
          </div>
        </>
      )}

      {qrisError ? <div className="notice error klikqris-error">{qrisError}</div> : null}

      <HowToPay />
    </motion.section>
  )
}
