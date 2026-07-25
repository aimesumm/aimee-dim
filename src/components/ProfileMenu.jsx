import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom' // jika memakai React Router
import { OWNER_WHATSAPP, getContactWhatsAppUrl } from '../data/siteConfig'

export default function ProfileMenu({ open, onClose }) {
  const whatsappUrl = getContactWhatsAppUrl()

  return (
    <AnimatePresence>
      {open && (
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
            <div className="profile-sheet-handle" />

            {/* WhatsApp */}
            <div className="profile-sheet-section">
              <p className="profile-sheet-title">Contact WhatsApp</p>

              {whatsappUrl ? (
                <a
                  className="profile-sheet-item"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="profile-sheet-item-icon">💬</span>
                  <span>WhatsApp</span>
                  <span className="profile-sheet-handle-text">
                    {OWNER_WHATSAPP}
                  </span>
                </a>
              ) : (
                <p className="profile-sheet-empty">
                  Nomor WhatsApp belum diatur.
                </p>
              )}
            </div>

            {/* Login Admin */}
            <div className="profile-sheet-section">
              <p className="profile-sheet-title">Admin</p>

              <Link
                to="/admin/login"
                className="profile-sheet-item"
                onClick={onClose}
              >
                <span className="profile-sheet-item-icon">🔒</span>
                <span>Login Admin</span>
              </Link>
            </div>

            <button
              type="button"
              className="ghost-btn profile-sheet-close"
              onClick={onClose}
            >
              Tutup
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
