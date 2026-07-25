import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useOrderDraft } from '../context/OrderDraftContext'
import { getStatusLabel, getWhatsAppOrderUrl } from '../data/siteConfig'

const QUICK_ACTIONS = [
  { id: 'menu', label: 'Menu' },
  { id: 'cart', label: 'Keranjang' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'qris', label: 'QRIS' },
  { id: 'cash', label: 'Tunai' },
  { id: 'status', label: 'Cek Status' },
  { id: 'wa', label: 'WhatsApp' },
]

export default function ChatbotWidget({ order, onOpenCart, onOpenCheckout, onScrollMenu }) {
  const navigate = useNavigate()
  const { cart } = useCart()
  const { setPreferredMethod } = useOrderDraft()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Halo, saya AIME Assistant. Gunakan tombol cepat untuk membuka menu, checkout, atau status pembayaran.' },
  ])

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart])
  const paymentStatus = String(order?.paymentStatus || order?.status || '').toLowerCase()
  const canSendWa = Boolean(order && paymentStatus === 'paid' && getWhatsAppOrderUrl(order))

  const pushBot = (text) => setMessages((prev) => [...prev, { role: 'bot', text }])
  const pushUser = (text) => setMessages((prev) => [...prev, { role: 'user', text }])

  const handleAction = (action) => {
    const latestStatus = order?.paymentStatus ? getStatusLabel(order.paymentStatus) : 'Belum ada order aktif'
    switch (action) {
      case 'menu':
        pushUser('Buka menu')
        onScrollMenu?.()
        pushBot('Menu sudah dibuka. Silakan pilih pesanan.')
        break
      case 'cart':
        pushUser('Buka keranjang')
        onOpenCart?.()
        pushBot(`Keranjang saat ini berisi ${cartCount} item.`)
        break
      case 'checkout':
        pushUser('Buka checkout')
        onOpenCheckout?.()
        pushBot('Checkout sudah dibuka.')
        break
      case 'qris':
        pushUser('Pilih QRIS')
        setPreferredMethod('QRIS')
        navigate('/checkout')
        pushBot('QRIS dipilih. Lanjutkan ke checkout untuk membuat pembayaran.')
        break
      case 'cash':
        pushUser('Pilih Tunai')
        setPreferredMethod('CASH')
        navigate('/checkout')
        pushBot('Tunai dipilih. Lanjutkan ke checkout untuk membuat pesanan.')
        break
      case 'status':
        pushUser('Cek status')
        if (order?.orderId) {
          navigate(`/pay/${String(order.paymentMethod || order.method || 'QRIS').toLowerCase()}/${order.orderId}`)
          pushBot(`Status terbaru: ${latestStatus}.`)
        } else {
          pushBot('Belum ada order aktif. Silakan checkout dulu.')
        }
        break
      case 'wa':
        pushUser('Buka WhatsApp')
        if (canSendWa) {
          window.open(getWhatsAppOrderUrl(order), '_blank', 'noopener,noreferrer')
          pushBot('WhatsApp owner sudah dibuka.')
        } else {
          pushBot('Tombol WhatsApp baru muncul setelah pembayaran berhasil.')
        }
        break
      default:
        pushBot('Perintah belum dikenali.')
    }
    setOpen(true)
  }

  return (
    <div className="chatbot-root">
      <AnimatePresence>
        {open ? (
          <motion.div
            className="chatbot-panel glass-card"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div className="chatbot-head">
              <div>
                <p className="eyebrow">AIME Assistant</p>
                <strong>{order?.orderId ? getStatusLabel(order.paymentStatus || order.status) : 'Siap membantu'}</strong>
              </div>
              <button className="icon-btn" onClick={() => setOpen(false)} type="button">×</button>
            </div>

            <div className="chatbot-log">
              {messages.slice(-6).map((message, index) => (
                <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                  {message.text}
                </div>
              ))}
            </div>

            <div className="chatbot-actions">
              {QUICK_ACTIONS.map((action) => (
                <button key={action.id} className="chip-btn" type="button" onClick={() => handleAction(action.id)}>
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button className="chatbot-launcher primary-btn" type="button" onClick={() => setOpen((value) => !value)}>
        Chat
      </button>
    </div>
  )
}
