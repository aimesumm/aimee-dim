import { getOrder, updateOrder } from './_store.js'
import { sendOrderToTelegram } from './_telegram.js'

function normalizeStatus(value) {
  const status = String(value || '').toUpperCase()
  if (status === 'PAID' || status === 'SUCCESS') return 'paid'
  if (status === 'EXPIRED') return 'expired'
  return 'pending'
}

function getPayload(root = {}) {
  if (root?.data && typeof root.data === 'object') {
    return { ...root, ...root.data }
  }
  return root
}

async function sendTelegramAfterPaid(order) {
  const existingNotifiedAt = String(order?.qris?.telegram_notified_at || '').trim()
  if (existingNotifiedAt) return order

  try {
    const telegramResult = await sendOrderToTelegram(order)
    if (!telegramResult?.sent) return order
    const qris = {
      ...(order.qris || {}),
      telegram_notified_at: new Date().toISOString(),
    }
    return (await updateOrder(order.orderId, { qris })) || { ...order, qris }
  } catch (error) {
    // Payment state must still be acknowledged to KlikQRIS even if Telegram is temporarily unavailable.
    console.error('[TELEGRAM] WEBHOOK NOTIFICATION FAILED', { orderId: order.orderId, message: error.message })
    return order
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const payload = getPayload(req.body || {})
    const orderId = String(payload.order_id || '').trim()
    const status = String(payload.status || '').toUpperCase()
    const callbackSignature = String(payload.signature || '').trim()

    if (!orderId) {
      return res.status(400).json({ message: 'order_id wajib diisi.' })
    }

    const order = await getOrder(orderId)
    if (!order) {
      return res.status(404).json({ message: 'Order tidak ditemukan.' })
    }

    const expectedSignature = String(order.qris?.signature || '').trim()
    if (!expectedSignature || !callbackSignature || expectedSignature !== callbackSignature) {
      return res.status(401).json({ message: 'Signature webhook tidak valid.' })
    }

    const paymentStatus = normalizeStatus(status)
    const currentStatus = String(order.paymentStatus || order.status || 'pending').toLowerCase()

    if (paymentStatus === 'paid') {
      const qris = {
        ...(order.qris || {}),
        ...payload,
        status: 'SUCCESS',
        paid_at: payload.payment_date || payload.paid_at || order.qris?.paid_at || null,
        total_amount: Number(payload.total_amount ?? order.qris?.total_amount ?? order.total ?? 0),
      }

      const updated = await updateOrder(orderId, {
        paymentStatus: 'paid',
        total: Number(qris.total_amount || order.total || 0),
        confirmedAt: payload.payment_date || payload.paid_at || new Date().toISOString(),
        qris,
      })

      const next = updated || { ...order, paymentStatus: 'paid', status: 'paid', total: qris.total_amount, qris }
      const notified = currentStatus === 'paid' || currentStatus === 'completed' ? next : await sendTelegramAfterPaid(next)

      return res.status(200).json({ ok: true, received: true, order: notified })
    }

    if (paymentStatus === 'expired' && currentStatus !== 'paid' && currentStatus !== 'completed') {
      const updated = await updateOrder(orderId, {
        paymentStatus: 'expired',
        qris: {
          ...(order.qris || {}),
          ...payload,
          status: 'EXPIRED',
        },
      })

      return res.status(200).json({ ok: true, received: true, order: updated || order })
    }

    return res.status(200).json({ ok: true, received: true, duplicate: true, order })
  } catch (error) {
    console.error('[KLIKRIS WEBHOOK] FAILED', error)
    return res.status(500).json({ message: error?.message || 'Webhook processing failed.' })
  }
}
