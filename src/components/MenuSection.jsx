import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categories } from '../data/siteConfig'
import { useCart } from '../context/CartContext'
import { useMenu } from '../context/MenuContext'
import { useAdminAuth } from '../context/AdminAuthContext'
import MenuCard from './MenuCard'
import AddMenuCard from './AddMenuCard'

function uniqCategoryList(items) {
  const ordered = ['Semua']
  const base = Array.isArray(categories) ? categories : []
  const raw = [...base, ...items.map((item) => item.category)]
  const seen = new Set()

  for (const cat of raw) {
    const label = String(cat || '').trim()
    if (!label) continue
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    ordered.push(label)
  }

  return ordered
}

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState('Semua')
  const { addItem } = useCart()
  const { items, loading } = useMenu()
  const { isAdmin } = useAdminAuth()
  const navigate = useNavigate()
  const tabRefs = useRef(new Map())

  const categoryList = useMemo(() => uniqCategoryList(items), [items])

  useEffect(() => {
    if (!categoryList.includes(activeCategory)) {
      setActiveCategory(categoryList[0] || 'Semua')
    }
  }, [activeCategory, categoryList])

  useEffect(() => {
    const node = tabRefs.current.get(activeCategory)
    if (node) {
      window.requestAnimationFrame(() => {
        node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      })
    }
  }, [activeCategory])

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
      <div className="menu-section-head">
        <div className="menu-section-copy">
          <p className="eyebrow">Pilih kategori</p>
          <h2>Geser kategori untuk melihat menu</h2>
        </div>
      </div>

      <div className="category-toolbar glass-card">
        <div className="menu-active-chip menu-active-chip-inline" aria-live="polite" title={activeCategory}>
          <strong>{activeCategory}</strong>
        </div>

        <div className="menu-tabs-shell">
          <div className="tabs scrollable menu-tabs" role="tablist" aria-label="Kategori menu">
            {categoryList.map((cat) => (
              <button
                key={cat}
                ref={(node) => {
                  if (node) {
                    tabRefs.current.set(cat, node)
                  } else {
                    tabRefs.current.delete(cat)
                  }
                }}
                className={activeCategory === cat ? 'tab active' : 'tab'}
                onClick={() => setActiveCategory(cat)}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat}
              >
                <span className="tab-label">{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="menu-results">
        <div className="menu-grid-v2">
          {filtered.map((item, index) => (
            <MenuCard key={item.id} item={item} index={index} onAdd={handleAdd} />
          ))}

          {isAdmin ? (
            <AddMenuCard index={filtered.length} onClick={() => navigate('/admin/menu/new')} />
          ) : null}
        </div>

        {!loading && !filtered.length && !isAdmin ? (
          <p className="section-copy menu-empty-state">Menu belum tersedia saat ini. Silakan cek kembali sebentar lagi.</p>
        ) : null}
      </div>
    </section>
  )
}
