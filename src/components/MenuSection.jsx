
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { menuItems } from '../data/menuItems'
import { categories } from '../data/siteConfig'
import { useCart } from '../context/CartContext'
import MenuCard from './MenuCard'

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState('Semua')
  const { addItem } = useCart()
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    return activeCategory === 'Semua'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory)
  }, [activeCategory])

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
      variant: '',
      variantLabel: '',
    })
  }

  return (
    <section className="menu-section" id="menu">
      <div className="section-head">
        <div>
          <p className="eyebrow">Menu utama</p>
          <h2>Pilihan dimsum dan minuman AIME-Dimsum</h2>
          <p className="section-copy">Pilih menu favoritmu, tambahkan ke keranjang, dan pesan dengan mudah.</p>
        </div>
        <div className="tabs scrollable">
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
      </div>
    </section>
  )
}
