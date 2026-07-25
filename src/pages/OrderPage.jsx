
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PaymentMethodPicker from '../components/PaymentMethodPicker'
import CustomerDetailsCard from '../components/CustomerDetailsCard'
import { useCart } from '../context/CartContext'
import { useOrderDraft } from '../context/OrderDraftContext'
import { createOrder, createQris } from '../services/paymentGateway'
import { currency, formatItemVariant, getOrderItemsCount, getSubtotal } from '../data/siteConfig'
import { MENU_PLACEHOLDER_IMAGE } from '../data/menuItems'
import { normalizeOrder, writeLastOrder } from '../lib/orderHelpers'

function readSelectedMethod(locationState, preferredMethod) {
  return locationState?.method || preferredMethod || 'QRIS'
}

export default function OrderPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart, clearCart, updateQty } = useCart()
  const { customer, preferredMethod, setPreferredMethod } = useOrderDraft()
  const [method, setMethod] = useState(() => readSelectedMethod(location.state, preferredMethod))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = useMemo(() => getSubtotal(cart), [cart])
  const serviceFee = cart.length ? 2000 : 0
  const total = subtotal + serviceFee
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
      setError('Isi nama dan nomor WhatsApp pelanggan terlebih dahulu.')
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
      <main className="container checkout-only-page order-page-layout">
        <motion.section
          className="order-head glass-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div>
            <p className="eyebrow">Order</p>
            <h1>Pesanan yang sudah dipilih</h1>
            <p className="hero-text">Edit jumlah item di sini, lalu lanjutkan ke metode pembayaran di bagian bawah.</p>
          </div>
          <div className="checkout-meta">
            <div className="meta-box">
              <span>Total item</span>
              <strong>{itemCount}</strong>
            </div>
            <div className="meta-box">
              <span>Total semua</span>
              <strong>{currency.format(total)}</strong>
            </div>
          </div>
        </motion.section>

        <section className="order-items-panel glass-card">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">Daftar pesanan</p>
              <h2>Geser ke kanan atau kiri</h2>
            </div>
          </div>

          {!cart.length ? (
            <div className="empty-state">
              <div className="empty-icon">🧾</div>
              <p>Belum ada item yang masuk ke keranjang.</p>
            </div>
          ) : (
            <div className="order-scroll" role="list" aria-label="Daftar pesanan">
              {cart.map((item) => {
                const lineTotal = Number(item.price || 0) * Number(item.qty || 0)
                return (
                  <motion.article
                    key={`${item.id}-${item.variant || ''}`}
                    className="order-item-card"
                    whileHover={{ y: -2 }}
                  >
                    <div className="order-item-thumb" aria-hidden="true">
                      {item.image || MENU_PLACEHOLDER_IMAGE ? <img src={item.image || MENU_PLACEHOLDER_IMAGE} alt="" /> : (item.emoji || '🥟')}
                    </div>
                    <div className="order-item-copy">
                      <strong>{item.name}</strong>
                      <span>{formatItemVariant(item) || 'Tanpa varian'}</span>
                      <small>{currency.format(item.price)}</small>
                    </div>
                    <div className="order-item-actions">
                      <div className="qty-control order-qty">
                        <button type="button" onClick={() => updateQty(item.id, -1, item.variant)} aria-label={`Kurangi ${item.name}`}>-</button>
                        <span>{item.qty}</span>
                        <button type="button" onClick={() => updateQty(item.id, 1, item.variant)} aria-label={`Tambah ${item.name}`}>+</button>
                      </div>
                      <strong className="order-line-total">{currency.format(lineTotal)}</strong>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </section>

        <CustomerDetailsCard />

        <PaymentMethodPicker
          value={method}
          onChange={setMethod}
          onContinue={handleContinue}
          loading={loading}
        />

        {error ? <div className="notice error">{error}</div> : null}
      </main>
    </div>
  )
}
