
const ADMIN_TOKEN_KEY = 'aime_admin_token'

export function getAdminToken() {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setAdminToken(token) {
  if (typeof window === 'undefined') return
  try {
    if (token) {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, token)
    } else {
      window.localStorage.removeItem(ADMIN_TOKEN_KEY)
    }
  } catch {
    // ignore storage failures
  }
}

async function parseResponse(response) {
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.message || 'Terjadi kesalahan, coba lagi.')
  }
  return data
}

export async function fetchMenuItems() {
  const response = await fetch('/api/menu-list')
  const data = await parseResponse(response)
  return data?.items || []
}

export async function adminLogin(password) {
  const response = await fetch('/api/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const data = await parseResponse(response)
  return data.token
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-token': getAdminToken(),
  }
}

export async function createMenuItem(payload) {
  const response = await fetch('/api/menu-create', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await parseResponse(response)
  return data.item
}

export async function updateMenuItem(id, payload) {
  const response = await fetch('/api/menu-update', {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ ...payload, id }),
  })
  const data = await parseResponse(response)
  return data.item
}

export async function deleteMenuItem(id) {
  const response = await fetch('/api/menu-delete', {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  })
  return parseResponse(response)
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'))
    reader.readAsDataURL(file)
  })
}
