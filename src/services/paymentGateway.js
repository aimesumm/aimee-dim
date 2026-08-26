export async function createQris(payload) {
  const response = await fetch('/api/create-qris', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Gagal membuat QRIS KlikQRIS')
  if (data.status !== 'success') throw new Error(data.message || 'Gagal membuat QRIS KlikQRIS')
  if (!data.qris || typeof data.qris !== 'object') {
    throw new Error('KlikQRIS berhasil dipanggil tetapi data QRIS tidak ditemukan.')
  }
  return data
}

export async function createOrder(payload) {
  const response = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Gagal membuat order')
  return data
}

export async function checkPayment(orderId) {
  const response = await fetch(`/api/check-payment?orderId=${encodeURIComponent(orderId)}`, {
    method: 'GET',
    cache: 'no-store',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Gagal mengecek pembayaran')
  return data
}

export async function updateOrderStatus(payload) {
  const response = await fetch('/api/update-order-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Gagal update status order')
  return data
}
