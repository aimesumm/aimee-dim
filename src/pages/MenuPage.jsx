
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import Hero from '../components/Hero'
import MenuSection from '../components/MenuSection'
import CartDrawer from '../components/CartDrawer'
import CustomerDetailsCard from '../components/CustomerDetailsCard'
import Footer from '../components/Footer'
import ChatbotWidget from '../components/ChatbotWidget'
import { useOrderDraft } from '../context/OrderDraftContext'

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
  const menuRef = useRef(null)
  const cartRef = useRef(null)
  const { preferredMethod } = useOrderDraft()

  const jumpMenu = () => menuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const openCart = () => cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const goCheckout = () => {
    navigate('/order', { state: { method: preferredMethod } })
  }

  return (
    <div className="app-shell">
      <Header onOpenCheckout={goCheckout} onGoMenu={jumpMenu} />

      <main className="container home-stack">
        <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="show">
          <Hero onJumpMenu={jumpMenu} onOpenCheckout={goCheckout} />
        </motion.div>

        <motion.div custom={0.05} variants={sectionVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <CustomerDetailsCard />
        </motion.div>

        <div ref={menuRef}>
          <motion.div custom={0.1} variants={sectionVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
            <MenuSection />
          </motion.div>
        </div>

        <div ref={cartRef}>
          <motion.div custom={0.1} variants={sectionVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
            <CartDrawer onOpenCheckout={goCheckout} />
          </motion.div>
        </div>
      </main>

      <Footer />

      <ChatbotWidget
        onScrollMenu={jumpMenu}
        onOpenCart={openCart}
        onOpenCheckout={goCheckout}
      />
    </div>
  )
}
