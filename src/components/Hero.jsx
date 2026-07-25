
import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Hero({ onJumpMenu, onOpenCheckout }) {
  const heroRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-copy .hero-kicker, .hero-copy h1, .hero-copy .hero-text, .hero-actions, .hero-microcopy', {
        opacity: 0,
        y: 18,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
      })

      gsap.from('.hero-visual', {
        opacity: 0,
        y: 18,
        scale: 0.98,
        duration: 0.8,
        delay: 0.12,
        ease: 'power3.out',
      })

      gsap.to('.hero-orb', {
        y: -14,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        stagger: 0.18,
        ease: 'sine.inOut',
      })

      gsap.to('.hero-dish', {
        rotate: 2,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={heroRef} className="hero-grid">
      <div className="hero-copy glass-card">
        <span className="hero-kicker">AIME-Dimsum • sakura ordering flow</span>
        <h1>Putih, pink, lembut, dan tetap profesional untuk mobile maupun desktop.</h1>
        <p className="hero-text">
          Pilih menu, tentukan varian sambal, atur jumlah dengan tombol plus minus, lalu lanjut ke checkout QRIS atau Tunai.
          Alur pembayaran tetap memakai backend yang sama, tampilannya saja yang dibuat lebih rapi dan elegan.
        </p>

        <div className="hero-actions">
          <button className="primary-btn" onClick={onJumpMenu} type="button">Lihat Menu</button>
          <button className="ghost-btn" onClick={onOpenCheckout} type="button">Checkout</button>
        </div>

        <div className="hero-microcopy">
          <span>Sakura theme</span>
          <span>Variant dimsum</span>
          <span>Sticky-free header</span>
        </div>
      </div>

      <div className="hero-visual glass-card">
        <div className="hero-orb hero-orb-a" />
        <div className="hero-orb hero-orb-b" />
        <div className="hero-dish">
          <span>🌸</span>
        </div>

        <div className="hero-panel">
          <strong>Flow singkat</strong>
          <p>Menu → Keranjang → Data pelanggan → Metode bayar → Konfirmasi owner</p>
        </div>

        <div className="hero-stats">
          <div><strong>2</strong><span>Metode bayar</span></div>
          <div><strong>5</strong><span>Varian sambal</span></div>
          <div><strong>1</strong><span>Layout sakura</span></div>
        </div>
      </div>
    </section>
  )
}
