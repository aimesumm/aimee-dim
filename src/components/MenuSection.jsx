
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
    transition: { duration: 0.42, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] },
  }),
}

function findCartQty(cart, id, variant) {
  const found = cart.find((item) => String(item.id) === String(id) && String(item.variant || '') === String(variant || ''))
  return found?.qty || 0
}

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [selectedVariantByItem, setSelectedVariantByItem] = useState({})
  const { cart, addItem, updateQty } = useCart()

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
          <h2>Pilihan dimsum dan minuman yang tertata</h2>
          <p className="section-copy">Pilih varian sambal, lalu atur jumlah dengan tombol plus minus tanpa membuat halaman penuh sesak.</p>
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
              className="menu-card glass-card"
              custom={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{ y: -4 }}
            >
              <div className="menu-top">
                <div className="menu-avatar" aria-hidden="true">{item.emoji}</div>
                <span className="menu-badge">{item.badge}</span>
              </div>
              <h3>{item.name}</h3>
              <p>{item.desc}</p>

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

              <div className="menu-bottom">
                <div>
                  <strong>{currency.format(item.price)}</strong>
                  {qty ? <div className="qty-hint">{qty} di keranjang {formatItemVariant({ variant: selectedVariant })}</div> : null}
                </div>

                <div className="qty-control inline">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, -1, selectedVariant)}
                    disabled={!qty}
                    aria-label={`Kurangi ${item.name}`}
                  >
                    -
                  </button>
                  <span>{qty}</span>
                  <button
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
              </div>

              <button
                className="ghost-btn small full-width"
                type="button"
                onClick={() => addItem({
                  ...item,
                  variant: selectedVariant,
                  variantLabel: selectedVariant,
                })}
              >
                Tambah ke keranjang
              </button>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
