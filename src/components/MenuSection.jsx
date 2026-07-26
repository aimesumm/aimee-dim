
import React, { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categories } from '../data/siteConfig'
import { useCart } from '../context/CartContext'
import { useMenu } from '../context/MenuContext'
import { useAdminAuth } from '../context/AdminAuthContext'
import MenuCard from './MenuCard'
import AddMenuCard from './AddMenuCard'

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState('Semua')
  const { addItem } = useCart()
  const { items, loading } = useMenu()
  const { isAdmin } = useAdminAuth()
  const navigate = useNavigate()

  // Drag-to-scroll untuk baris kategori (khusus mouse di desktop).
  // Ini murni interaksi UI, tidak menyentuh logic filter kategori.
  const tabsScrollRef = useRef(null)
  const dragInfo = useRef({ isDragging: false, startX: 0, startScrollLeft: 0, moved: false })

  const handleTabsMouseDown = (e) => {
    const el = tabsScrollRef.current
    if (!el) return
    dragInfo.current = {
      isDragging: true,
      startX: e.pageX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    }
  }

  const handleTabsMouseMove = (e) => {
    const el = tabsScrollRef.current
    if (!el || !dragInfo.current.isDragging) return
    const delta = e.pageX - dragInfo.current.startX
    if (Math.abs(delta) > 3) dragInfo.current.moved = true
    el.scrollLeft = dragInfo.current.startScrollLeft - delta
  }

  const stopTabsDrag = () => {
    dragInfo.current.isDragging = false
  }

  const handleTabClick = (cat) => (e) => {
    // Cegah klik kategori tidak sengaja setelah drag mouse.
    if (dragInfo.current.moved) {
      e.preventDefault()
      dragInfo.current.moved = false
      return
    }
    setActiveCategory(cat)
  }

  const filtered = useMemo(() => {
    return activeCategory === 'Semua'
      ? items
      : items.filter((item) => item.category === activeCategory)
  }, [activeCategory, items])

  const handleAdd = (item) => {
    if (item.hasVariantPage) {
      navigate(`/variant/${item.id}`)
      return
    }

    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      emoji: item.emoji,
      image: item.image,
      variant: '',
      variantLabel: '',
    })
  }

  return (
    <section className="menu-section" id="menu">
      <div className="section-head">
        <div>
          <p className="eyebrow">Menu utama</p>
          <h2>Pilihan makanan, minuman, paket, dan lainnya AIME-Dimsum</h2>
          <p className="section-copy">Pilih menu favoritmu, tambahkan ke keranjang, dan pesan dengan mudah.</p>
        </div>
      </div>

      <div className="category-tabs-card">
        <div
          className="tabs scrollable"
          ref={tabsScrollRef}
          onMouseDown={handleTabsMouseDown}
          onMouseMove={handleTabsMouseMove}
          onMouseUp={stopTabsDrag}
          onMouseLeave={stopTabsDrag}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              className={activeCategory === cat ? 'tab active' : 'tab'}
              onClick={handleTabClick(cat)}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-grid-v2">
        {filtered.map((item, index) => (
          <MenuCard key={item.id} item={item} index={index} onAdd={handleAdd} />
        ))}

        {isAdmin ? (
          <AddMenuCard index={filtered.length} onClick={() => navigate('/admin/menu/new')} />
        ) : null}
      </div>

      {!loading && !filtered.length && !isAdmin ? (
        <p className="section-copy">Menu belum tersedia saat ini. Silakan cek kembali sebentar lagi.</p>
      ) : null}
    </section>
  )
}
