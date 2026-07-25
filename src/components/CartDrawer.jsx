
import React from 'react'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { currency, getSubtotal, formatItemVariant } from '../data/siteConfig'

export default function CartDrawer({ onOpenCheckout }) {
  const { cart, updateQty } = useCart()
  const subtotal = getSubtotal(cart)
  const serviceFee = cart.length ? 2000 : 0
  const total = subtotal + serviceFee

  return (
    <motion.section
      className="cart-panel glass-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45 }}
    >
      <div className="section-head compact">
        <div>
          <p className="eyebrow">Keranjang</p>
          <h2>Pesanan dipilih</h2>
        </div>
        <button className="ghost-btn small" onClick={onOpenCheckout} disabled={!cart.length} type="button">
          Checkout
        </button>
      </div>

      {!cart.length ? (
        <div className="empty-state">
          <div className="empty-icon">🧾</div>
          <p>Keranjang masih kosong. Tambahkan menu terlebih dahulu.</p>
        </div>
      ) : (
        <div className="cart-list">
          {cart.map((item, index) => (
            <motion.div
              key={`${item.id}-${item.variant || ''}`}
              className="cart-item"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              <div className="cart-item-info">
                <strong>{item.name}</strong>
                <span>{formatItemVariant(item) || 'Tanpa varian'}</span>
                <span>{currency.format(item.price)}</span>
              </div>
              <div className="qty-control">
                <button type="button" onClick={() => updateQty(item.id, -1, item.variant)} aria-label={`Kurangi ${item.name}`}>-</button>
                <span>{item.qty}</span>
                <button type="button" onClick={() => updateQty(item.id, 1, item.variant)} aria-label={`Tambah ${item.name}`}>+</button>
              </div>
            </motion.div>
          ))}

          <div className="summary">
            <div><span>Subtotal</span><strong>{currency.format(subtotal)}</strong></div>
            <div><span>Biaya layanan</span><strong>{currency.format(serviceFee)}</strong></div>
            <div className="summary-total"><span>Total</span><strong>{currency.format(total)}</strong></div>
          </div>
        </div>
      )}
    </motion.section>
  )
}
