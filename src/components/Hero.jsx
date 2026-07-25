
import React from 'react'

export default function Hero() {
  return (
    <section className="hero-grid">
      <div className="hero-copy glass-card">
        <span className="hero-kicker">AIME-Dimsum</span>
        <h1>Tampilan lebih bersih, ringan, dan enak dilihat di mobile maupun desktop.</h1>
        <p className="hero-text">
          Menu dibuat lebih ringkas, data pelanggan dipindah ke halaman order, dan alur pembayaran tetap mudah dipakai tanpa mengganggu tampilan.
        </p>

        <div className="hero-microcopy">
          <span>Ringan</span>
          <span>Rapi</span>
          <span>Responsive</span>
        </div>
      </div>

      <div className="hero-visual glass-card hero-preview">
        <div className="hero-preview-image">
          <span className="hero-preview-icon">🌸</span>
          <strong>Slot gambar menu</strong>
          <p>Area kosong untuk foto menu atau banner nanti.</p>
        </div>

        <div className="hero-panel">
          <strong>Alur singkat</strong>
          <p>Menu → Order → Pembayaran → Konfirmasi owner</p>
        </div>
      </div>
    </section>
  )
}
