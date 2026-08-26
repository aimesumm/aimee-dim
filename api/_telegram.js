const TELEGRAM_API_BASE = 'https://api.telegram.org'

function getConfig() {
  return {
    token: String(process.env.TELEGRAM_BOT_TOKEN || '').trim(),
    chatId: String(process.env.TELEGRAM_CHAT_ID || '').trim(),
  }
}

function formatVariant(item = {}) {
  const label = String(item.variantLabel || item.variant_name || item.variant || '').trim()
  if (!label || /-variant-\d+$/i.test(label)) return ''
  return ` (${label})`
}

function buildMessage(order = {}) {
  const items = (order.items || [])
    .map((item) => `• ${item.name}${formatVariant(item)} x${item.qty ?? item.quantity ?? 0}`)
    .join('\n') || '• -'

  const total = Number(order.qris?.total_amount ?? order.total ?? 0)
  const status = String(order.paymentStatus || order.status || 'pending').toLowerCase()
  const statusLabel = status === 'paid' ? 'PEMBAYARAN BERHASIL' : status === 'expired' ? 'QRIS KEDALUWARSA' : status.toUpperCase()

  return [
    '🍱 PESANAN BARU AIME-Dimsum',
    '',
    `🆔 Order ID: ${order.orderId || '-'}`,
    `👤 Customer: ${order.customerName || order.name || '-'}`,
    `📱 WhatsApp: ${order.customerPhone || order.customer_phone || order.phone || '-'}`,
    `✉️ Email: ${order.customerEmail || order.customer_email || order.email || '-'}`,
    '',
    '🛒 PESANAN:',
    items,
    '',
    `📝 Catatan: ${String(order.note || order.customerNote || '-').trim() || '-'}`,
    `📦 Jumlah item: ${order.items?.reduce((sum, item) => sum + Number(item.qty ?? item.quantity ?? 0), 0) || 0}`,
    `💰 Total: Rp ${total.toLocaleString('id-ID')}`,
    `💳 Pembayaran: ${String(order.paymentMethod || order.method || 'QRIS').toUpperCase()}`,
    `📌 Status: ${statusLabel}`,
    '',
    '✅ Tidak ada tombol konfirmasi manual. Pesanan dikirim sebagai informasi order.',
  ].join('\n')
}

export async function sendOrderToTelegram(order = {}) {
  const { token, chatId } = getConfig()

  if (!token || !chatId) {
    return { sent: false, skipped: true, reason: 'Telegram environment variables are not configured.' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  let response
  try {
    response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(order),
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.ok !== true) {
    throw new Error(data?.description || 'Telegram gagal mengirim notifikasi order.')
  }

  return { sent: true, messageId: data?.result?.message_id || null }
}
