import { getOrder, updateOrder } from './_store.js'

function normalizeStatus(value) {
  const status = String(value || '').toUpperCase()
  if (status === 'PAID' || status === 'SUCCESS') return 'paid'
  if (status === 'EXPIRED') return 'expired'
  return 'pending'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const root = req.body || {}
    const payload = root?.data && typeof root.data === 'object' ? { ...root, ...root.data } : root
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

    // Idempotent: PAID/SUCCESS hanya mengubah transaksi yang masih pending.
    if (paymentStatus === 'paid' && currentStatus !== 'paid' && currentStatus !== 'completed') {
      const updated = await updateOrder(orderId, {
        paymentStatus: 'paid',
        confirmedAt: payload.payment_date || payload.paid_at || new Date().toISOString(),
        qris: {
          ...(order.qris || {}),
          ...payload,
          status: 'SUCCESS',
          paid_at: payload.payment_date || payload.paid_at || order.qris?.paid_at || null,
        },
      })

      return res.status(200).json({ ok: true, received: true, order: updated })
    }

    if (paymentStatus === 'expired' && currentStatus === 'pending') {
      const updated = await updateOrder(orderId, {
        paymentStatus: 'expired',
        qris: {
          ...(order.qris || {}),
          ...payload,
          status: 'EXPIRED',
        },
      })

      return res.status(200).json({ ok: true, received: true, order: updated })
    }

    return res.status(200).json({ ok: true, received: true, duplicate: true, order })
  } catch (error) {
    console.error('[KLIKRIS WEBHOOK] FAILED', error)
    return res.status(500).json({ message: error?.message || 'Webhook processing failed.' })
  }
}
