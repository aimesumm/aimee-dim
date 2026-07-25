
import React from 'react'
import { useCart } from '../context/CartContext'

export default function Header({ onOpenCheckout, onGoMenu }) {
  const { cart } = useCart()
  const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0)

  return (
    <header className="topbar glass-card">
      <div className="brand-block">
        <div className="brand">AIME-Dimsum</div>
        <div className="subtitle">Sakura ordering • QRIS • Tunai • Telegram owner</div>
      </div>

      <div className="topbar-actions">
        <button className="chip-btn" onClick={onGoMenu} type="button">Menu</button>
        <button className="cart-chip" onClick={onOpenCheckout} type="button">
          Pesan <span>{count}</span>
        </button>
      </div>
    </header>
  )
}
