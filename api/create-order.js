import { attachTelegramMessageId, createOrderRecord } from './_store.js'
import { buildOwnerMessage, ensureTelegramWebhook, formatOrderTime, getMethodLabel, getOrderItemsCount, getStatusLabel } from './_shared.js'

async function sendTelegramMessage(order) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) return null

  const payload = {
    chat_id: chatId,
    text: buildOwnerMessage(order),
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Konfirmasi Pembayaran', callback_data: `confirm_payment:${order.orderId}` },
      ]],
    },
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok) {
    throw new Error(data?.description || 'Failed to send Telegram notification')
  }

  return data.result || null
}

function buildResponse(order, telegramMessageId = null) {
  return {
    ...order,
    paymentStatus: order.paymentStatus || order.status || 'pending',
    status: order.paymentStatus || order.status || 'pending',
    statusLabel: getStatusLabel(order.paymentStatus || order.status),
    methodLabel: getMethodLabel(order.paymentMethod || order.method),
    timeLabel: formatOrderTime(order.createdAt || order.time),
    itemCount: getOrderItemsCount(order.items || []),
    telegramMessageId: telegramMessageId || order.telegramMessageId || null,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const body = req.body || {}
    const paymentMethod = String(body.paymentMethod || body.method || 'QRIS').toUpperCase() === 'CASH' ? 'CASH' : 'QRIS'
    const items = Array.isArray(body.items) ? body.items : []
    const itemCount = getOrderItemsCount(items)
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || item.quantity || 0), 0)
    const total = Number(body.total || subtotal)

    console.log('[CREATE ORDER] payload received', {
      paymentMethod,
      itemCount,
      total,
    })

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
      paymentStatus: 'pending',
    })

    let telegramMessage = null

    try {
      await ensureTelegramWebhook(req)
      telegramMessage = await sendTelegramMessage(created)
      if (telegramMessage?.message_id) {
        await attachTelegramMessageId(created.orderId, telegramMessage.message_id)
      }
      console.log('[CREATE ORDER] Telegram Sent', {
        orderId: created.orderId,
        messageId: telegramMessage?.message_id || null,
      })
    } catch (error) {
      console.error('[CREATE ORDER] Telegram send failed', {
        orderId: created.orderId,
        message: error.message,
      })
    }

    return res.status(200).json(buildResponse({
      ...created,
      telegramMessageId: telegramMessage?.message_id || created.telegramMessageId || null,
    }, telegramMessage?.message_id || null))
  } catch (error) {
    console.error('[CREATE ORDER] FAILED', {
      message: error.message,
    })
    return res.status(500).json({ message: error.message || 'Failed to create order' })
  }
}
