import { confirmOrder, getOrder } from './_store.js'
import {
  buildTelegramAlreadyConfirmedMessage,
  buildTelegramConfirmedMessage,
  buildTelegramFailedMessage,
  nowIso,
} from './_shared.js'

async function telegramApi(method, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return null

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    return await response.json().catch(() => null)
  } catch {
    return null
  }
}

function parseCallbackData(data = '') {
  const [action, orderId] = String(data).split(':')
  return { action, orderId }
}

async function confirmPayment(orderId) {
  try {
    return await confirmOrder(orderId, { confirmedAt: nowIso() })
  } catch (error) {
    return { ok: false, status: 500, message: error?.message || 'Confirmation failed' }
  }
}

async function editTelegramMessage(callback, text, replyMarkup) {
  if (!callback?.message?.chat?.id || !callback?.message?.message_id) return null
  return telegramApi('editMessageText', {
    chat_id: callback.message.chat.id,
    message_id: callback.message.message_id,
    text,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const body = req.body || {}
    const callback = body.callback_query

    if (!callback?.data) {
      return res.status(200).json({ ok: true, ignored: true })
    }

    const { action, orderId } = parseCallbackData(callback.data)
    const callbackQueryId = callback.id

    if (action !== 'confirm_payment') {
      await telegramApi('answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text: 'Aksi callback tidak dikenali.',
        show_alert: false,
      })
      return res.status(200).json({ ok: true, ignored: true })
    }

    const currentOrder = await getOrder(orderId)
    if (!currentOrder) {
      await telegramApi('answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text: 'Order tidak ditemukan.',
        show_alert: true,
      })
      return res.status(404).json({ ok: false, message: 'Order not found' })
    }

    const confirmResult = await confirmPayment(orderId)

    if (!confirmResult.ok) {
      const isAlreadyConfirmed = confirmResult.status === 409

      await telegramApi('answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text: isAlreadyConfirmed ? 'Order ini sudah dikonfirmasi sebelumnya.' : 'Backend tidak merespon.',
        show_alert: true,
      })

      const messageText = isAlreadyConfirmed
        ? buildTelegramAlreadyConfirmedMessage(confirmResult.order || currentOrder)
        : buildTelegramFailedMessage()

      await telegramApi('sendMessage', {
        chat_id: callback.message?.chat?.id,
        text: messageText,
      })

      return res.status(confirmResult.status || 500).json({
        ok: false,
        message: confirmResult.message || 'Confirmation failed',
      })
    }

    const updatedOrder = confirmResult.order || currentOrder

    await telegramApi('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text: 'Pembayaran berhasil dikonfirmasi.',
      show_alert: false,
    })

    await editTelegramMessage(callback, buildTelegramConfirmedMessage(updatedOrder), {
      inline_keyboard: [],
    })

    await telegramApi('sendMessage', {
      chat_id: callback.message?.chat?.id,
      text: buildTelegramConfirmedMessage(updatedOrder),
    })

    return res.status(200).json({ ok: true, updated: true, order: updatedOrder })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Webhook error' })
  }
}
