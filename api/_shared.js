const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
}

const PAYMENT_METHOD = {
  QRIS: 'QRIS',
  CASH: 'Tunai',
}

const STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Menunggu Konfirmasi Owner',
  [PAYMENT_STATUS.PAID]: 'Pembayaran Berhasil',
  [PAYMENT_STATUS.PROCESSING]: 'Pesanan Diproses',
  [PAYMENT_STATUS.COMPLETED]: 'Pesanan Selesai',
}

const METHOD_LABELS = {
  [PAYMENT_METHOD.QRIS]: 'QRIS',
  [PAYMENT_METHOD.CASH]: 'Tunai',
}

export function nowIso() {
  return new Date().toISOString()
}

function getAdminSecret() {
  return String(process.env.ADMIN_PASSWORD || 'admindimsum').trim()
}

export async function getAdminToken(password) {
  const secret = getAdminSecret()
  if (String(password || '') !== secret) return null

  const cryptoModule = await import('crypto')
  return cryptoModule.createHmac('sha256', secret).update('aime-dimsum-admin').digest('hex')
}

export async function isValidAdminToken(token) {
  if (!token) return false
  const cryptoModule = await import('crypto')
  const secret = getAdminSecret()
  const expected = cryptoModule.createHmac('sha256', secret).update('aime-dimsum-admin').digest('hex')
  if (String(token).length !== expected.length) return false
  return cryptoModule.timingSafeEqual(Buffer.from(String(token)), Buffer.from(expected))
}

export async function requireAdmin(req, res) {
  const token = req.headers['x-admin-token'] || req.headers['X-Admin-Token']
  const valid = await isValidAdminToken(token)
  if (!valid) {
    res.status(401).json({ message: 'Unauthorized: admin login required' })
    return false
  }
  return true
}


export function getStatusLabel(status) {
  return STATUS_LABELS[String(status || '').toLowerCase()] || status || 'Draft Pesanan'
}

export function getMethodLabel(method) {
  const normalized = String(method || '').toUpperCase()
  return METHOD_LABELS[normalized] || method || '-'
}

export function formatOrderTime(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Asia/Makassar',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function getOrderItemsCount(items = []) {
  return items.reduce((sum, item) => sum + Number(item.qty ?? item.quantity ?? 0), 0)
}

export function normalizePaymentMethod(value) {
  return String(value || 'QRIS').toUpperCase() === 'CASH' ? 'CASH' : 'QRIS'
}

export function normalizePaymentStatus(value) {
  const normalized = String(value || 'pending').toLowerCase()
  if (normalized === 'paid' || normalized === 'processing' || normalized === 'completed') return normalized
  return 'pending'
}

export function buildOwnerMessage(order = {}) {
  const items = (order.items || [])
    .map((item) => `- ${item.name} x${item.qty ?? item.quantity ?? 0}`)
    .join('\n')

  return `🍱 PESANAN BARU AIME-Dimsum\n\n🆔 Order ID:\n${order.orderId || '-'}\n\n👤 Nama Customer:\n${order.customerName || order.name || '-'}\n\n📱 Nomor Customer:\n${order.customerPhone || order.phone || '-'}\n\n🛒 Detail Pesanan:\n\n${items || '-'}\n\nJumlah Item:\n${getOrderItemsCount(order.items || [])}\n\n💰 Total:\nRp ${Number(order.total || 0).toLocaleString('id-ID')}\n\n💳 Metode Pembayaran:\n${getMethodLabel(order.paymentMethod || order.method)}\n\n📌 Status:\n${getStatusLabel(order.paymentStatus || order.status)}\n\n⏰ Waktu:\n${formatOrderTime(order.createdAt || order.time)}`
}

export function buildTelegramPendingMessage(order = {}) {
  return `🍱 PESANAN BARU AIME-Dimsum\n\n🆔 Order ID:\n${order.orderId || '-'}\n\n👤 Customer:\n${order.customerName || order.name || '-'}\n\n💰 Nominal:\nRp ${Number(order.total || 0).toLocaleString('id-ID')}\n\n💳 Metode:\n${getMethodLabel(order.paymentMethod || order.method)}\n\nStatus :\n🟡 MENUNGGU KONFIRMASI\n\nTekan tombol di bawah jika pembayaran sudah diterima.`
}

export function buildTelegramConfirmedMessage(order = {}) {
  return `✅ Pembayaran berhasil dikonfirmasi\n\n━━━━━━━━━━━━━━━━━━\n\nOrder ID :\n${order.orderId || '-'}\n\nStatus :\n🟢 PAID\n\nNominal :\nRp ${Number(order.total || 0).toLocaleString('id-ID')}\n\nMetode :\n${getMethodLabel(order.paymentMethod || order.method)}\n\nWaktu Konfirmasi :\n${formatOrderTime(order.confirmedAt)}\n\nWebsite pelanggan telah diperbarui.\n\nSilakan tunggu pelanggan menekan tombol\n"Kirim Pesanan Saya".\n\n━━━━━━━━━━━━━━━━━━`
}

export function buildTelegramAlreadyConfirmedMessage(order = {}) {
  return `⚠️ Order ini sudah dikonfirmasi sebelumnya.\n\nOrder ID :\n${order.orderId || '-'}\n\nStatus :\n🟢 PAID\n\nWaktu Konfirmasi :\n${formatOrderTime(order.confirmedAt)}`
}

export function buildTelegramFailedMessage() {
  return `❌ Gagal mengkonfirmasi pembayaran.\n\nBackend tidak merespon.\n\nSilakan coba kembali.`
}

export function getWebhookBaseUrl(req) {
  const proto = (req?.headers?.['x-forwarded-proto'] || 'https').toString().split(',')[0].trim()
  const host = (req?.headers?.['x-forwarded-host'] || req?.headers?.host || process.env.VERCEL_URL || '').toString().split(',')[0].trim()
  if (!host) return ''
  if (host.startsWith('http://') || host.startsWith('https://')) return host.replace(/\/$/, '')
  return `${proto}://${host.replace(/\/$/, '')}`
}

export function getTelegramWebhookUrl(req) {
  const configuredBaseUrl = String(process.env.APP_BASE_URL || process.env.SITE_URL || '').trim().replace(/\/$/, '')
  const baseUrl = configuredBaseUrl || getWebhookBaseUrl(req)
  if (!baseUrl) return ''
  return `${baseUrl}/api/telegram-webhook`
}

export async function ensureTelegramWebhook(req) {
  const token = String(process.env.TELEGRAM_BOT_TOKEN || '').trim()
  const webhookUrl = getTelegramWebhookUrl(req)

  if (!token || !webhookUrl) {
    return { ok: false, skipped: true, webhookUrl }
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        drop_pending_updates: false,
        allowed_updates: ['callback_query'],
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.ok) {
      throw new Error(data?.description || 'Failed to set Telegram webhook')
    }

    return { ok: true, webhookUrl, result: data.result || null }
  } catch (error) {
    console.warn('[TELEGRAM WEBHOOK] setup failed', { webhookUrl, message: error.message })
    return { ok: false, webhookUrl, message: error.message }
  }
}

