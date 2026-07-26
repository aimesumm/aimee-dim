
export const LAST_ORDER_KEY = 'aime_dimsum_last_order_v2'

export function readLastOrder() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LAST_ORDER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeLastOrder(order) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order))
  } catch {
    // ignore
  }
}

export function normalizeOrder(payload, fallback = null) {
  if (!payload && fallback) return fallback
  if (!payload) return null

  const merged = {
    ...fallback,
    ...payload,
    paymentStatus: payload.paymentStatus || payload.status || fallback?.paymentStatus || 'pending',
    status: payload.paymentStatus || payload.status || fallback?.status || 'pending',
    paymentMethod: payload.paymentMethod || payload.method || fallback?.paymentMethod || fallback?.method || 'QRIS',
    method: payload.paymentMethod || payload.method || fallback?.method || 'QRIS',
    customerName: payload.customerName || payload.name || fallback?.customerName || fallback?.name || '',
    customerPhone: payload.customerPhone || payload.phone || fallback?.customerPhone || fallback?.phone || '',
    createdAt: payload.createdAt || payload.time || fallback?.createdAt || fallback?.time || new Date().toISOString(),
    time: payload.createdAt || payload.time || fallback?.time || new Date().toISOString(),
  }

  if (payload.qris !== undefined && payload.qris !== null) {
    if (fallback?.qris && typeof payload.qris === 'object' && typeof fallback.qris === 'object') {
      merged.qris = { ...fallback.qris, ...payload.qris }
    } else {
      merged.qris = payload.qris
    }
  } else if (fallback?.qris && merged.qris == null) {
    merged.qris = fallback.qris
  }

  return merged
}
