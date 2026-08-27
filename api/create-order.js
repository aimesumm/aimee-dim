import { createOrderRecord } from './_store.js'
import { formatOrderTime, getMethodLabel, getOrderItemsCount, getStatusLabel } from './_shared.js'
import { sendOrderToTelegram } from './_telegram.js'

function parsePrice(value, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : fallback
  const raw = String(value ?? '').trim().replace(/^rp\.?\s*/i, '').replace(/\s+/g, '')
  if (!raw) return fallback
  let normalized = raw.replace(/[^0-9,.-]/g, '')
  const commaIndex = normalized.lastIndexOf(',')
  const dotIndex = normalized.lastIndexOf('.')
  if (commaIndex >= 0 && dotIndex >= 0) {
    normalized = commaIndex > dotIndex ? normalized.replace(/\./g, '').replace(',', '.') : normalized.replace(/,/g, '')
  } else if (commaIndex >= 0) {
    const digitsAfter = normalized.length - commaIndex - 1
    normalized = digitsAfter === 3 ? normalized.replace(/,/g, '') : normalized.replace(',', '.')
  } else if (dotIndex >= 0) {
    const digitsAfter = normalized.length - dotIndex - 1
    normalized = digitsAfter === 3 ? normalized.replace(/\./g, '') : normalized
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback
}

function buildResponse(order) {
  return {
    ...order,
    paymentStatus: order.paymentStatus || order.status || 'pending',
    status: order.paymentStatus || order.status || 'pending',
    statusLabel: getStatusLabel(order.paymentStatus || order.status),
    methodLabel: getMethodLabel(order.paymentMethod || order.method),
    timeLabel: formatOrderTime(order.createdAt || order.time),
    itemCount: getOrderItemsCount(order.items || []),
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const body = req.body || {}
    const paymentMethod = String(body.paymentMethod || body.method || 'QRIS').toUpperCase() === 'CASH' ? 'CASH' : 'QRIS'
    const rawItems = Array.isArray(body.items) ? body.items : []
    const items = rawItems.map((item) => {
      const qty = Math.max(0, Number(item?.qty ?? item?.quantity ?? 0) || 0)
      const hasBasePrice = item?.basePrice !== undefined && item?.basePrice !== null && item?.basePrice !== ''
      const basePrice = parsePrice(hasBasePrice ? item.basePrice : item.price)
      const variantPrice = parsePrice(item?.variantPrice)
      const unitPrice = hasBasePrice ? basePrice + variantPrice : parsePrice(item?.price)
      return {
        ...item,
        qty,
        quantity: qty,
        basePrice,
        variantPrice,
        price: unitPrice,
        lineTotal: unitPrice * qty,
      }
    })
    const itemCount = getOrderItemsCount(items)
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || item.quantity || 0), 0)
    const total = subtotal

    const created = await createOrderRecord({
      customerName: body.customerName || body.name || 'Pelanggan',
      customerPhone: body.customerPhone || body.phone || '-',
      customerEmail: body.customerEmail || body.email || '-',
      note: body.note || '',
      items,
      itemCount,
      subtotal,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'CASH' ? 'paid' : 'pending',
      ...(paymentMethod === 'CASH' ? { confirmedAt: new Date().toISOString() } : {}),
    })

    // Tunai is already considered paid at checkout, so the owner receives the order immediately.
    // QRIS is sent only after KlikQRIS reports SUCCESS/PAID through webhook or status check.
    if (paymentMethod === 'CASH') {
      try {
        await sendOrderToTelegram(created)
      } catch (telegramError) {
        console.error('[TELEGRAM] CASH ORDER NOTIFICATION FAILED', { orderId: created.orderId, message: telegramError.message })
      }
    }

    return res.status(200).json(buildResponse(created))
  } catch (error) {
    console.error('[CREATE ORDER] FAILED', error)
    return res.status(500).json({ message: error.message || 'Failed to create order' })
  }
}
