
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PaymentMethodPicker from '../components/PaymentMethodPicker'
import { useCart } from '../context/CartContext'
import { useOrderDraft } from '../context/OrderDraftContext'
import { createOrder, createQris } from '../services/paymentGateway'
import { currency, getOrderItemsCount, getSubtotal } from '../data/siteConfig'
import { normalizeOrder, writeLastOrder } from '../lib/orderHelpers'

function readSelectedMethod(locationState, preferredMethod) {
  return locationState?.method || preferredMethod || 'QRIS'
}

export default function OrderPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart, clearCart } = useCart()
  const { customer, preferredMethod, setPreferredMethod } = useOrderDraft()
  const [method, setMethod] = useState(() => readSelectedMethod(location.state, preferredMethod))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = useMemo(() => getSubtotal(cart), [cart])
  const total = subtotal + (cart.length ? 2000 : 0)
  const itemCount = getOrderItemsCount(cart)

  const buildItems = () => cart.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    qty: item.qty,
    category: item.category,
    variant: item.variant,
    variantLabel: item.variantLabel,
  }))

  const handleContinue = async () => {
    setError('')
    if (!cart.length) {
      setError('Keranjang masih kosong.')
      return
    }

    if (!customer.name.trim() || !customer.phone.trim()) {
      setError('Isi nama dan nomor WhatsApp pelanggan terlebih dahulu di halaman utama.')
      return
    }

    setLoading(true)
    setPreferredMethod(method)

    try {
      const payload = {
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        note: customer.note.trim(),
        items: buildItems(),
        itemCount,
        subtotal,
        total,
        paymentMethod: method,
      }

      const created = await createOrder(payload)
      const normalizedCreated = normalizeOrder(created)

      if (method === 'QRIS') {
        let nextOrder = normalizedCreated

        try {
          const qris = await createQris({
            orderId: created.orderId,
            total: created.total,
          })

          nextOrder = normalizeOrder({
            ...created,
            qris,
          }, created)
        } catch {
          // tetap lanjut ke halaman QRIS agar user bisa retry di sana
        }

        writeLastOrder(nextOrder)
        clearCart()
        navigate(`/payment/qris/${created.orderId}`, {
          replace: true,
          state: { order: nextOrder },
        })
        return
      }

      writeLastOrder(normalizedCreated)
      clearCart()
      navigate(`/payment/cash/${created.orderId}`, {
        replace: true,
        state: { order: normalizedCreated },
      })
    } catch (err) {
      setError(err.message || 'Checkout gagal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <main className="container checkout-only-page">
        <div className="checkout-compact">
          <motion.div
            className="checkout-head glass-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div>
              <p className="eyebrow">Order</p>
              <h1>Langkah terakhir sebelum pembayaran</h1>
              <p className="hero-text">
                Semua order masuk ke Telegram owner lebih dulu. WhatsApp baru muncul setelah status pembayaran berhasil.
              </p>
            </div>
            <div className="checkout-meta">
              <div className="meta-box">
                <span>Jumlah item</span>
                <strong>{itemCount}</strong>
              </div>
              <div className="meta-box">
                <span>Total</span>
                <strong>{currency.format(total)}</strong>
              </div>
            </div>
          </motion.div>

          <PaymentMethodPicker
            value={method}
            onChange={setMethod}
            onContinue={handleContinue}
            loading={loading}
          />

          {error ? <div className="notice error">{error}</div> : null}
        </div>
      </main>
    </div>
  )
}
