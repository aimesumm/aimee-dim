
import React from 'react'

export default function Header({ onGoMenu }) {
  return (
    <header className="topbar glass-card">
      <div className="brand-block">
        <div className="brand">AIME-Dimsum</div>
        <div className="subtitle">Sakura menu • QRIS • Tunai</div>
      </div>

      <div className="topbar-actions">
        <button className="chip-btn" onClick={onGoMenu} type="button">Menu</button>
      </div>
    </header>
  )
}
