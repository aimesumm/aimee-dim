import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerDetailsCard from '../components/CustomerDetailsCard'
import PaymentMethodPicker from '../components/PaymentMethodPicker'
import { createOrder } from '../services/paymentGateway'
import { useCart } from '../context/CartContext'
import { useOrderDraft } from '../context/OrderDraftContext'
import { normalizeOrder, writeLastOrder } from '../lib/orderHelpers'

export default function PaymentPage() {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { customer, preferredMethod, setPreferredMethod } = useOrderDraft()
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedMethod, setSelectedMethod] = useState(() => String(preferredMethod || 'QRIS').toUpperCase())

  // Redirect jika cart kosong
  useEffect(() => {
    if (!cart.length) {
      navigate('/order', { replace: true })
    }
  }, [cart.length, navigate])

  const submitDraftPayment = async () => {
    // Validasi cart
    if (!cart.length) {
      setError('Keranjang masih kosong.')
      return
    }

    // Validasi customer data
    if (!customer.name.trim() || !customer.phone.trim() || !customer.email.trim()) {
      setError('Isi nama, nomor WhatsApp, dan email pelanggan terlebih dahulu.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Prepare items
      const items = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        basePrice: item.basePrice ?? item.price,
        variantPrice: item.variantPrice ?? 0,
        qty: item.qty,
        category: item.category,
        variant: item.variant,
        variantLabel: item.variantLabel,
      }))

      // Calculate subtotal
      const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0)

      // Create order payload
      const payload = {
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        customerEmail: customer.email.trim(),
        note: customer.note.trim(),
        items,
        itemCount: items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
        subtotal,
        total: subtotal,
        paymentMethod: selectedMethod,
      }

      // Create order di backend
      const created = await createOrder(payload)
      
      if (!created?.orderId) {
        throw new Error('Backend tidak mengembalikan Order ID')
      }

      // Normalize order
      const nextOrder = normalizeOrder(created)

      // Simpan ke localStorage
      writeLastOrder(nextOrder)

      // Clear cart
      clearCart()

      // Save preferred method
      setPreferredMethod(selectedMethod)

      // Navigate ke Payment Confirmation
      navigate(`/payment-confirmation/${String(selectedMethod || 'QRIS').toLowerCase()}/${created.orderId}`, {
        replace: true,
        state: { order: nextOrder },
      })
    } catch (err) {
      setError(err.message || 'Checkout gagal.')
      console.error('submitDraftPayment error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <main className="container payment-gateway-page payment-draft-page">
        <CustomerDetailsCard
          hideNote={false}
          title="Isi data customer"
          copy="Nama, nomor WhatsApp, dan email akan dikirim ke backend sebelum admin mengonfirmasi pesanan."
        />

        <PaymentMethodPicker
          value={selectedMethod}
          onChange={setSelectedMethod}
          onContinue={submitDraftPayment}
          loading={submitting}
        />

        {error ? <div className="notice error">{error}</div> : null}
      </main>
    </div>
  )
}
