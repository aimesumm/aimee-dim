import { getOrder, updateOrder } from './_store.js'

const DEFAULT_BASE_URL = 'https://klikqris.com/api'

function getConfig() {
  return {
    apiKey: String(process.env.KLIKRIS_API_KEY || process.env.KLIQRIS_API_KEY || '').trim(),
    merchantId: String(process.env.KLIKRIS_MERCHANT_ID || process.env.KLIQRIS_MERCHANT_ID || '').trim(),
    baseUrl: String(process.env.KLIKRIS_BASE_URL || process.env.KLIQRIS_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/$/, ''),
  }
}

function statusToPaymentStatus(status) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'SUCCESS' || normalized === 'PAID') return 'paid'
  if (normalized === 'EXPIRED') return 'expired'
  return 'pending'
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const orderId = String(req.query?.orderId || '').trim()
    if (!orderId) return res.status(400).json({ message: 'orderId wajib diisi.' })

    const { apiKey, merchantId, baseUrl } = getConfig()
    if (!apiKey || !merchantId) {
      return res.status(500).json({ message: 'KlikQRIS belum dikonfigurasi di environment.' })
    }

    const order = await getOrder(orderId)
    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan.' })

    const response = await fetch(`${baseUrl}/qris/status/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        id_merchant: merchantId,
      },
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok || data?.status !== true) {
      return res.status(response.ok ? 400 : response.status).json({
        message: data?.message || 'Gagal mengambil status dari KlikQRIS.',
      })
    }

    const remote = data.data || {}
    const localQris = order.qris || {}
    const remoteSignature = String(remote.signature || '').trim()
    const localSignature = String(localQris.signature || '').trim()

    if (localSignature && remoteSignature && localSignature !== remoteSignature) {
      return res.status(409).json({ message: 'Signature transaksi tidak cocok.' })
    }

    const qris = {
      ...localQris,
      ...remote,
      status: String(remote.status || localQris.status || 'PENDING').toUpperCase(),
      total_amount: Number(remote.total_amount ?? localQris.total_amount ?? order.total ?? 0),
    }

    const paymentStatus = statusToPaymentStatus(remote.status)
    const updated = await updateOrder(orderId, {
      qris,
      paymentStatus,
      ...(paymentStatus === 'paid' ? { confirmedAt: remote.paid_at || new Date().toISOString() } : {}),
    })

    return res.status(200).json({
      ...(updated || order),
      qris,
      paymentStatus,
      status: paymentStatus,
    })
  } catch (error) {
    console.error('[CHECK PAYMENT] FAILED', error)
    return res.status(500).json({ message: error?.message || 'Gagal mengecek pembayaran.' })
  }
}
