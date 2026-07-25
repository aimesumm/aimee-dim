import { attachTelegramMessageId, getOrder, updateOrder } from './_store.js'
import { buildOwnerMessage } from './_shared.js'

async function callConverter(total) {
  const qrisData = process.env.QRIS_DATA || ''
  const apiUrl = `https://cvqris-ariepulsa.my.id/api/?qris_data=${encodeURIComponent(qrisData)}&nominal=${encodeURIComponent(total)}`
  const response = await fetch(apiUrl)
  const text = await response.text()
  let payload = null

  try {
    payload = JSON.parse(text)
  } catch {
    payload = { message: text }
  }

  return { response, payload }
}

async function sendTelegramMessage(order) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) return null

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildOwnerMessage(order),
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Konfirmasi Pembayaran', callback_data: `confirm_payment:${order.orderId}` },
        ]],
      },
    }),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok) {
    throw new Error(data?.description || 'Failed to send Telegram notification')
  }

  return data.result || null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const orderId = String(req.body?.orderId || '').trim()
    const bodyTotal = Number(req.body?.total || 0)

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' })
    }

    const order = await getOrder(orderId)
    if (!order) {
      console.error('[CREATE QRIS] ORDER NOT FOUND', { orderId })
      return res.status(404).json({ message: 'Order not found', orderId })
    }

    const total = Number(order.total || bodyTotal || 0)
    if (!total || Number.isNaN(total)) {
      return res.status(400).json({ message: 'total is required' })
    }

    console.log('[CREATE QRIS] UUID:', orderId)

    const { response, payload } = await callConverter(total)

    if (!response.ok || payload?.status !== 'success' || !payload?.link_qris) {
      console.error('[CREATE QRIS] CONVERTER FAILED', {
        orderId,
        status: response.status,
        payload,
      })
      return res.status(502).json({
        message: payload?.message || 'Failed to generate QRIS',
        status: payload?.status || 'error',
      })
    }

    const normalized = {
      status: 'success',
      nominal: String(payload.nominal ?? total),
      link_qris: String(payload.link_qris || ''),
      converted_qris: String(payload.converted_qris || ''),
      generated_at: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }

    const updated = await updateOrder(orderId, { qris: normalized })

    if (!updated) {
      console.error('[CREATE QRIS] UPDATE FAILED - ORDER NOT FOUND', { orderId })
      return res.status(404).json({ message: 'Order not found', orderId })
    }

    console.log('[CREATE QRIS] INSERT/UPDATE SUCCESS', { orderId })

    let telegramMessageId = updated.telegramMessageId || null

    if (String(updated.paymentMethod || updated.method || '').toUpperCase() === 'QRIS' && !telegramMessageId) {
      try {
        await ensureTelegramWebhook(req)
        const telegramMessage = await sendTelegramMessage(updated)
        telegramMessageId = telegramMessage?.message_id || null
        if (telegramMessageId) {
          await attachTelegramMessageId(orderId, telegramMessageId)
        }
        console.log('[CREATE QRIS] Telegram Sent', { orderId, messageId: telegramMessageId })
      } catch (error) {
        console.error('[CREATE QRIS] Telegram send failed', {
          orderId,
          message: error.message,
        })
      }
    }

    return res.status(200).json({
      ...normalized,
      orderId,
      telegramMessageId,
    })
  } catch (error) {
    console.error('[CREATE QRIS] FAILED', {
      message: error.message,
    })
    return res.status(500).json({ message: error.message || 'Failed to create QRIS' })
  }
}
