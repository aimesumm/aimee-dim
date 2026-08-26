import { getOrder, updateOrder } from './_store.js'

const DEFAULT_BASE_URL = 'https://klikqris.com/api'

function getConfig() {
  const apiKey = String(process.env.KLIKRIS_API_KEY || process.env.KLIQRIS_API_KEY || '').trim()
  const merchantId = String(process.env.KLIKRIS_MERCHANT_ID || process.env.KLIQRIS_MERCHANT_ID || '').trim()
  const baseUrl = String(process.env.KLIKRIS_BASE_URL || process.env.KLIQRIS_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/$/, '')
  return { apiKey, merchantId, baseUrl }
}

function getBaseUrl(req) {
  const configured = String(process.env.APP_BASE_URL || process.env.SITE_URL || '').trim().replace(/\/$/, '')
  if (configured) return configured

  const proto = String(req?.headers?.['x-forwarded-proto'] || 'https').split(',')[0].trim()
  const host = String(req?.headers?.['x-forwarded-host'] || req?.headers?.host || '').split(',')[0].trim()
  if (!host) return ''
  return `${proto}://${host}`
}

function normalizeQris(data = {}, requestTotal = 0) {
  const totalAmount = Number(data.total_amount ?? requestTotal)
  return {
    order_id: data.order_id,
    nama_toko: data.nama_toko,
    tanggal: data.tanggal,
    amount: Number(data.amount ?? requestTotal),
    amount_uniq: Number(data.amount_uniq ?? 0),
    total_amount: totalAmount,
    status: String(data.status || 'PENDING').toUpperCase(),
    qris_url: data.qris_url || null,
    qris_image: data.qris_image || null,
    expired_at: data.expired_at || null,
    paid_at: data.paid_at || null,
    signature: data.signature || null,
    keterangan: data.keterangan || null,
    expired_menit: data.expired_menit || null,
    created_at: data.created_at || null,
    updated_at: data.updated_at || null,
    redirect_url: data.redirect_url || null,
    direct_url: data.direct_url || null,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { apiKey, merchantId, baseUrl } = getConfig()

    if (!apiKey || !merchantId) {
      return res.status(500).json({
        message: 'KlikQRIS belum dikonfigurasi. Atur KLIKRIS_API_KEY dan KLIKRIS_MERCHANT_ID di environment Vercel.',
      })
    }

    const orderId = String(req.body?.orderId || '').trim()
    const requestedAmount = Math.round(Number(req.body?.amount ?? req.body?.total ?? 0))

    if (!orderId) return res.status(400).json({ message: 'orderId wajib diisi.' })
    if (!Number.isInteger(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ message: 'Nominal pembayaran tidak valid.' })
    }

    const order = await getOrder(orderId)
    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan.' })
    if (String(order.paymentMethod || order.method || '').toUpperCase() !== 'QRIS') {
      return res.status(400).json({ message: 'Order ini bukan pembayaran QRIS.' })
    }

    const existing = order.qris || null
    if (existing?.status && ['PENDING', 'SUCCESS', 'PAID'].includes(String(existing.status).toUpperCase()) && existing?.signature && existing?.qris_url) {
      return res.status(200).json({
        status: 'success',
        message: 'QRIS already exists',
        qris: existing,
        totalAmount: Number(existing.total_amount ?? order.total ?? requestedAmount),
      })
    }

    const callbackBase = getBaseUrl(req)
    const callbackUrl = callbackBase ? `${callbackBase}/api/klikqris-webhook` : undefined

    const payload = {
      order_id: orderId,
      amount: requestedAmount,
      id_merchant: merchantId,
      keterangan: String(req.body?.keterangan || `Pembayaran Order ${orderId}`).trim(),
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
    }

    const response = await fetch(`${baseUrl}/qris/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        id_merchant: merchantId,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok || data?.status !== true) {
      return res.status(response.ok ? 400 : response.status).json({
        message: data?.message || 'KlikQRIS gagal membuat transaksi.',
        details: data,
      })
    }

    const qris = normalizeQris(data.data, requestedAmount)
    const updated = await updateOrder(orderId, { qris })

    return res.status(200).json({
      status: 'success',
      message: data.message || 'Transaction Created Successfully',
      orderId,
      qris,
      totalAmount: Number(qris.total_amount || requestedAmount),
      order: updated,
    })
  } catch (error) {
    console.error('[CREATE QRIS] FAILED', error)
    return res.status(500).json({ message: error?.message || 'Gagal membuat QRIS.' })
  }
}
