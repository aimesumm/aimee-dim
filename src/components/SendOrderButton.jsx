
import React from 'react'
import { getWhatsAppOrderUrl } from '../data/siteConfig'

export default function SendOrderButton({ order }) {
  const paymentStatus = String(order?.paymentStatus || order?.status || '').toLowerCase()
  if (paymentStatus !== 'paid') return null

  const url = getWhatsAppOrderUrl(order)

  if (!url) {
    return (
      <button className="primary-btn" type="button" disabled>
        WhatsApp admin belum diatur
      </button>
    )
  }

  return (
    <a className="primary-btn send-order-btn" href={url} target="_blank" rel="noreferrer">
      Kirim Pesanan Anda ke WhatsApp
    </a>
  )
}
