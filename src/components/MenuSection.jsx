
import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { menuItems } from '../data/menuItems'
import { categories, currency, formatItemVariant } from '../data/siteConfig'
import { useCart } from '../context/CartContext'

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: (index) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, delay: index * 0.045, ease: [0.16, 1, 0.3, 1] },
  }),
}

function findCartQty(cart, id, variant) {
  const found = cart.find((item) => String(item.id) === String(id) && String(item.variant || '') === String(variant || ''))
  return found?.qty || 0
}

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [selectedVariantByItem, setSelectedVariantByItem] = useState({})
  const { cart, addItem } = useCart()

  const filtered = useMemo(() => {
    return activeCategory === 'Semua'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory)
  }, [activeCategory])

  return (
    <section className="menu-section" id="menu">
      <div className="section-head">
        <div>
          <p className="eyebrow">Menu utama</p>
          <h2>Pilihan dimsum dan minuman yang ringkas</h2>
          <p className="section-copy">Kartu dibuat kecil, ada slot gambar, dan varian bisa digeser ke samping agar layar tetap rapi.</p>
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

      <div className="menu-grid">
        {filtered.map((item, index) => {
          const defaultVariant = item.variants?.[0] || ''
          const selectedVariant = selectedVariantByItem[item.id] || defaultVariant
          const qty = findCartQty(cart, item.id, selectedVariant)

          return (
            <motion.article
              key={item.id}
              className="menu-card glass-card compact"
              custom={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{ y: -3 }}
            >
              <div className="menu-top">
                <div className="menu-image-frame" aria-hidden="true">
                  <span className="menu-avatar">{item.emoji}</span>
                </div>
                <span className="menu-badge">{item.badge}</span>
              </div>

              <div className="menu-body">
                <h3>{item.name}</h3>
                <p>{item.desc}</p>
              </div>

              {item.variants?.length ? (
                <div className="variant-picker">
                  <span className="variant-title">Varian sambal</span>
                  <div className="variant-scroll">
                    {item.variants.map((variant) => (
                      <button
                        key={variant}
                        type="button"
                        className={selectedVariant === variant ? 'variant-chip active' : 'variant-chip'}
                        onClick={() => setSelectedVariantByItem((prev) => ({ ...prev, [item.id]: variant }))}
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="menu-bottom compact">
                <div className="price-block">
                  <strong>{currency.format(item.price)}</strong>
                  {qty ? <div className="qty-hint">{qty} di keranjang {formatItemVariant({ variant: selectedVariant })}</div> : null}
                </div>

                <button
                  className="add-icon-btn"
                  type="button"
                  onClick={() => addItem({
                    ...item,
                    variant: selectedVariant,
                    variantLabel: selectedVariant,
                  })}
                  aria-label={`Tambah ${item.name}`}
                >
                  +
                </button>
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
