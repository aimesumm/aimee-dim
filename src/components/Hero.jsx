import React from 'react'

export default function Hero() {
  return (
    <section className="hero-grid hero-cream-grid">
      <div className="hero-copy glass-card">
        <p className="hero-kicker">Booth • Display • Custom</p>
        <h1>Desain Booth Kustom Anda</h1>
        <p className="hero-text">
          Wujudkan booth yang rapi, elegan, dan mudah dikenali pelanggan dengan tampilan
          premium bernuansa warm cream dan burgundy yang nyaman dilihat di layar apa pun.
        </p>

        <div className="hero-actions">
          <a className="primary-btn" href="#menu">
            Dapatkan Kutipan
          </a>
          <a className="ghost-btn" href="#menu">
            Lihat Katalog
          </a>
        </div>

        <div className="hero-microcopy" aria-label="Keunggulan utama">
          <span>Layout simetris</span>
          <span>Visual premium</span>
          <span>Responsif penuh</span>
        </div>
      </div>

      <div className="hero-visual glass-card hero-showcase">
        <div className="hero-showcase-frame hero-frame-a">
          <div className="hero-showcase-image hero-frame-image-a" aria-hidden="true">
            <span>📷</span>
          </div>
          <div className="hero-showcase-caption">
            <strong>Frame booth utama</strong>
            <p>Area showcase foto produk atau booth yang sejajar dan bersih.</p>
          </div>
        </div>

        <div className="hero-showcase-stack">
          <div className="hero-showcase-frame hero-frame-b">
            <div className="hero-showcase-image hero-frame-image-b" aria-hidden="true">
              <span>✨</span>
            </div>
            <div className="hero-showcase-caption">
              <strong>Tampilan dekoratif</strong>
              <p>Border halus, warna hangat, dan kontras teks yang nyaman.</p>
            </div>
          </div>

          <div className="hero-showcase-strip">
            <span>60% Cream</span>
            <span>30% Charcoal</span>
            <span>10% Burgundy</span>
          </div>
        </div>
      </div>
    </section>
  )
}
