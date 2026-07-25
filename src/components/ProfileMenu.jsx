import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OWNER_WHATSAPP, getContactWhatsAppUrl } from '../data/siteConfig'

export default function ProfileMenu({ open, onClose }) {
  const whatsappUrl = getContactWhatsAppUrl()

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
              <p className="profile-sheet-title">Contact WhatsApp</p>
              {whatsappUrl ? (
                <a className="profile-sheet-item" href={whatsappUrl} target="_blank" rel="noreferrer">
                  <span className="profile-sheet-item-icon" aria-hidden="true">💬</span>
                  <span>WhatsApp</span>
                  <span className="profile-sheet-handle-text">{OWNER_WHATSAPP}</span>
                </a>
              ) : (
                <p className="profile-sheet-empty">Nomor WhatsApp belum diatur.</p>
              )}
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
