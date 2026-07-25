
import React from 'react'
import { motion } from 'framer-motion'
import { currency } from '../data/siteConfig'
import { MENU_PLACEHOLDER_IMAGE } from '../data/menuItems'

export default function MenuCard({ item, index = 0, onAdd }) {
  return (
    <motion.article
      className="menu-card-v2 glass-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.38, delay: index * 0.045, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
    >
      <div className="menu-card-v2-image">
        {(item.image || MENU_PLACEHOLDER_IMAGE) ? (
          <img src={item.image || MENU_PLACEHOLDER_IMAGE} alt={item.name} loading="lazy" />
        ) : (
          <span className="menu-card-v2-emoji" aria-hidden="true">{item.emoji}</span>
        )}
        {item.badge ? <span className="menu-badge">{item.badge}</span> : null}
      </div>

      <div className="menu-card-v2-body">
        <h3>{item.name}</h3>
        <strong className="menu-card-v2-price">{currency.format(item.price)}</strong>
      </div>

      <button
        className="menu-card-v2-add"
        type="button"
        onClick={() => onAdd(item)}
        aria-label={`Add ${item.name}`}
      >
        Add
      </button>
    </motion.article>
  )
}
