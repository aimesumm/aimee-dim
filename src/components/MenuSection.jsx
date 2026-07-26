
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

  // Saat kategori "Semua" aktif, kelompokkan menu per kategori. Tiap
  // kategori tampil sebagai card sendiri dengan scroll horizontal, agar
  // halaman tidak memanjang ke bawah hanya karena banyak kategori.
  const groupedByCategory = useMemo(() => {
    if (activeCategory !== 'Semua') return []

    const map = new Map()
    items.forEach((item) => {
      const cat = item.category || 'Lainnya'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat).push(item)
    })

    const orderedCats = categories.filter((cat) => cat !== 'Semua' && map.has(cat))
    map.forEach((_, cat) => {
      if (!orderedCats.includes(cat)) orderedCats.push(cat)
    })

    return orderedCats.map((cat) => ({ category: cat, items: map.get(cat) }))
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

      {activeCategory === 'Semua' ? (
        <div className="menu-groups">
          {groupedByCategory.map((group) => (
            <div className="menu-group-card" key={group.category}>
              <div className="menu-group-head">
                <h3>{group.category}</h3>
                <span className="menu-group-count">{group.items.length} menu</span>
              </div>
              <div className="menu-group-scroll" role="list" aria-label={`Menu kategori ${group.category}`}>
                {group.items.map((item, index) => (
                  <MenuCard key={item.id} item={item} index={index} onAdd={handleAdd} />
                ))}
              </div>
            </div>
          ))}

          {isAdmin ? (
            <div className="menu-group-card">
              <div className="menu-group-head">
                <h3>Tambah menu</h3>
              </div>
              <div className="menu-group-scroll">
                <AddMenuCard index={items.length} onClick={() => navigate('/admin/menu/new')} />
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="menu-grid-v2">
          {filtered.map((item, index) => (
            <MenuCard key={item.id} item={item} index={index} onAdd={handleAdd} />
          ))}

          {isAdmin ? (
            <AddMenuCard index={filtered.length} onClick={() => navigate('/admin/menu/new')} />
          ) : null}
        </div>
      )}

      {!loading && !filtered.length && !isAdmin ? (
        <p className="section-copy">Menu belum tersedia saat ini. Silakan cek kembali sebentar lagi.</p>
      ) : null}
    </section>
  )
}
