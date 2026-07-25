
import React, { useState } from 'react'
import ProfileMenu from './ProfileMenu'

export default function Header({ onGoMenu }) {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="topbar glass-card">
      <div className="brand-block">
        <div className="brand">AIME-Dimsum</div>
        <div className="subtitle">Sakura menu • QRIS • Tunai</div>
      </div>

      <div className="topbar-actions">
        <button className="chip-btn" onClick={onGoMenu} type="button">Menu</button>
        <button
          className="icon-btn kebab-btn"
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label="Buka menu profil"
        >
          ⋮
        </button>
      </div>

      <ProfileMenu open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  )
}
