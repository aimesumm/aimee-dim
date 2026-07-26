import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Header({ onGoMenu }) {
  const navigate = useNavigate()

  return (
    <header className="topbar glass-card">
      <div className="brand-block">
        <div className="brand">Aime Dimsum</div>
        <div className="subtitle">Maroon menu • QRIS • Tunai</div>
      </div>

      <div className="topbar-actions">
        <button className="chip-btn" onClick={onGoMenu} type="button">Menu</button>
        <button
          className="icon-btn kebab-btn"
          type="button"
          onClick={() => navigate('/profile')}
          aria-label="Buka halaman profile"
        >
          ⋮
        </button>
      </div>
    </header>
  )
}
