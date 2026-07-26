
import React, { useMemo, useState } from 'react'
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
      <div className="section-head menu-section-head">
        <div>
          <p className="eyebrow">Menu utama</p>
          <h2>Pilihan makanan, minuman, paket, dan lainnya AIME-Dimsum</h2>
          <p className="section-copy">Pilih menu favoritmu, tambahkan ke keranjang, dan pesan dengan mudah.</p>
        </div>
      </div>

      <div className="category-scroll-card glass-card">
        <div className="tabs scrollable category-tabs" role="tablist" aria-label="Kategori menu">
          {categories.map((cat) => (
            <button
              key={cat}
              className={activeCategory === cat ? 'tab active' : 'tab'}
              onClick={() => setActiveCategory(cat)}
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
