import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Header({ onGoMenu }) {
  const navigate = useNavigate()

  return (
    <header className="topbar glass-card">
      <div className="brand-block">
        <div className="brand">Aime Dimsum</div>
        <div className="subtitle">Warm cream • burgundy • charcoal</div>
      </div>

      <div className="topbar-actions">
        <button className="chip-btn" onClick={onGoMenu} type="button">
          Menu
        </button>
        <button
          className="primary-btn topbar-cta"
          type="button"
          onClick={() => navigate('/profile')}
          aria-label="Hubungi Kami"
        >
          Hubungi Kami
        </button>
      </div>
    </header>
  )
}
