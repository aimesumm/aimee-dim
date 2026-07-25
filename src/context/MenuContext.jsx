
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fallbackMenuItems } from '../data/menuItems'
import { fetchMenuItems } from '../lib/menuApi'

const MenuContext = createContext(null)

function normalizeBackendItem(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price) || 0,
    desc: row.description || '',
    badge: row.badge || '',
    image: row.imageUrl || '',
    emoji: row.imageUrl ? '' : '🍽️',
    hasVariantPage: Boolean(row.hasVariant) && Array.isArray(row.variants) && row.variants.length > 0,
    variantOptions: Array.isArray(row.variants)
      ? row.variants.map((variant, index) => ({
          key: `${row.id}-variant-${index}`,
          label: variant.label,
          price: Number(variant.price) || 0,
        }))
      : [],
    sortOrder: Number(row.sortOrder) || 0,
  }
}

export function MenuProvider({ children }) {
  const [items, setItems] = useState(fallbackMenuItems)
  const [source, setSource] = useState('fallback')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchMenuItems()
      if (rows.length) {
        setItems(rows.map(normalizeBackendItem))
        setSource('backend')
      } else {
        setItems(fallbackMenuItems)
        setSource('fallback')
      }
    } catch (error) {
      console.warn('[MENU] Gagal memuat menu dari backend, memakai data bawaan.', error.message)
      setItems(fallbackMenuItems)
      setSource('fallback')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(() => ({ items, loading, source, refresh }), [items, loading, source, refresh])

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu harus dipakai di dalam MenuProvider')
  return ctx
}
