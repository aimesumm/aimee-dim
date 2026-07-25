
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { OWNER_WHATSAPP, CONTACT_EMAIL, socialLinks, getContactWhatsAppUrl } from '../data/siteConfig'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function ProfileMenu({ open, onClose }) {
  const navigate = useNavigate()
  const { isAdmin, logout } = useAdminAuth()
  const whatsappUrl = getContactWhatsAppUrl()

  const goLogin = () => {
    onClose()
    navigate(isAdmin ? '/admin/dashboard' : '/admin/login')
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="profile-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="profile-sheet glass-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="profile-sheet-handle" aria-hidden="true" />

            <div className="profile-sheet-section">
              <p className="profile-sheet-title">Your Account</p>
              <button type="button" className="profile-sheet-item" onClick={goLogin}>
                <span>{isAdmin ? 'Dashboard Admin' : 'Login Account'}</span>
                <span aria-hidden="true">›</span>
              </button>
              {isAdmin ? (
                <button type="button" className="profile-sheet-item" onClick={handleLogout}>
                  <span>Logout Admin</span>
                  <span aria-hidden="true">›</span>
                </button>
              ) : null}
            </div>

            {socialLinks.length ? (
              <div className="profile-sheet-section">
                <p className="profile-sheet-title">Social Media</p>
                {socialLinks.map((social) => (
                  <a
                    key={social.key}
                    className="profile-sheet-item"
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="profile-sheet-item-icon" aria-hidden="true">{social.icon}</span>
                    <span>{social.label}</span>
                    {social.handle ? <span className="profile-sheet-handle-text">{social.handle}</span> : null}
                  </a>
                ))}
              </div>
            ) : null}

            <div className="profile-sheet-section">
              <p className="profile-sheet-title">Contact Us</p>
              {whatsappUrl ? (
                <a className="profile-sheet-item" href={whatsappUrl} target="_blank" rel="noreferrer">
                  <span className="profile-sheet-item-icon" aria-hidden="true">💬</span>
                  <span>WhatsApp</span>
                  <span className="profile-sheet-handle-text">{OWNER_WHATSAPP}</span>
                </a>
              ) : null}
              {CONTACT_EMAIL ? (
                <a className="profile-sheet-item" href={`mailto:${CONTACT_EMAIL}`}>
                  <span className="profile-sheet-item-icon" aria-hidden="true">✉️</span>
                  <span>Email</span>
                  <span className="profile-sheet-handle-text">{CONTACT_EMAIL}</span>
                </a>
              ) : null}
              {!whatsappUrl && !CONTACT_EMAIL ? (
                <p className="profile-sheet-empty">Kontak belum diatur.</p>
              ) : null}
            </div>

            <button type="button" className="ghost-btn profile-sheet-close" onClick={onClose}>
              Tutup
            </button>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
