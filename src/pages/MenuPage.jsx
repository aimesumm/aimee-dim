
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useOrderDraft } from '../context/OrderDraftContext'
import Header from '../components/Header'
import Hero from '../components/Hero'
import MenuSection from '../components/MenuSection'
import Footer from '../components/Footer'
import { currency, getSubtotal } from '../data/siteConfig'

const sectionVariants = {
  hidden: { opacity: 0, y: 22 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function MenuPage() {
  const navigate = useNavigate()
  const { cart } = useCart()
  const { preferredMethod } = useOrderDraft()

  const subtotal = getSubtotal(cart)
  const serviceFee = cart.length ? 2000 : 0
  const total = subtotal + serviceFee

  const goCheckout = () => {
    navigate('/order', { state: { method: preferredMethod } })
  }

  return (
    <div className="app-shell">
      <Header onGoMenu={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />

      <main className="container home-stack">
        <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="show">
          <Hero />
        </motion.div>

        <motion.div custom={0.08} variants={sectionVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <MenuSection />
        </motion.div>
      </main>

      {cart.length ? (
        <button className="floating-checkout glass-card" type="button" onClick={goCheckout} aria-label="Checkout">
          <span className="floating-checkout-icon">🛒</span>
          <span className="floating-checkout-price">{currency.format(total)}</span>
        </button>
      ) : null}

      <Footer />
    </div>
  )
}
