import React from 'react'
import { currency, formatOrderTime, getMethodLabel, getStatusLabel, getSubtotal, getOrderItemsCount, formatItemVariant } from '../data/siteConfig'

export default function OrderSummary({ order, cart = [] }) {
  const items = order?.items || cart
  const subtotal = order?.subtotal ?? getSubtotal(items)
  const total = order?.total ?? subtotal

  return (
    <div className="order-summary">
      {/* Bagian Ringkasan Order hingga Total telah dihapus */}
    </div>
  )
}
