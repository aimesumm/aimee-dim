import { supabase } from '../lib/supabase.js'
import { nowIso } from './_shared.js'

const MENU_TABLE = 'menu_items'

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getMissingColumn(error) {
  const message = String(error?.message || '')
  const match = message.match(/could not find the '([^']+)' column/i)
  if (match) return match[1]
  const match2 = message.match(/column [\"']?([^\"']+)[\"']? does not exist/i)
  if (match2) return match2[1]
  return null
}

async function retryWithMissingColumnFallback(basePayload, queryFn, options = {}) {
  const { label = 'SUPABASE', maxRetries = 20 } = options
  let payload = { ...basePayload }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await queryFn(payload)
    if (!result?.error) return result

    const missingColumn = getMissingColumn(result.error)
    if (!missingColumn) return result

    console.warn(`[${label}] Missing column '${missingColumn}', retrying without it...`)
    delete payload[missingColumn]
  }

  return { error: new Error('Too many missing columns while retrying Supabase request') }
}

function normalizeVariants(variants) {
  if (!Array.isArray(variants)) return []
  return variants
    .map((variant) => ({
      label: String(variant?.label || variant?.name || '').trim(),
      price: toNumber(variant?.price, 0),
    }))
    .filter((variant) => variant.label)
}

function mapRow(row) {
  if (!row) return null

  return {
    id: row.id,
    name: row.name || '',
    category: row.category || 'Makanan',
    price: toNumber(row.price, 0),
    imageUrl: row.image_url || '',
    badge: row.badge || '',
    description: row.description || '',
    hasVariant: Boolean(row.has_variant),
    variants: normalizeVariants(row.variants),
    sortOrder: toNumber(row.sort_order, 0),
    createdAt: row.created_at || nowIso(),
    updatedAt: row.updated_at || nowIso(),
  }
}

function buildRow(item = {}) {
  const hasVariant = Boolean(item.hasVariant)
  const variants = hasVariant ? normalizeVariants(item.variants) : []

  return {
    name: String(item.name || '').trim(),
    category: item.category === 'Minuman' ? 'Minuman' : 'Makanan',
    price: toNumber(item.price, 0),
    image_url: item.imageUrl || null,
    badge: item.badge || null,
    description: item.description || null,
    has_variant: hasVariant,
    variants,
    sort_order: toNumber(item.sortOrder, 0),
    updated_at: nowIso(),
  }
}

export async function listMenuItems() {
  const { data, error } = await supabase
    .from(MENU_TABLE)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load menu items: ${error.message}`)
  }

  return clone((data || []).map(mapRow))
}

export async function createMenuItem(item = {}) {
  const row = buildRow(item)
  row.created_at = nowIso()

  const { data, error } = await retryWithMissingColumnFallback(
    row,
    async (payload) => supabase.from(MENU_TABLE).insert(payload).select('*').single(),
    { label: 'CREATE MENU ITEM' },
  )

  if (error) {
    throw new Error(`Failed to create menu item: ${error.message}`)
  }

  return clone(mapRow(data))
}

export async function updateMenuItem(id, patch = {}) {
  const resolvedId = String(id || '').trim()
  if (!resolvedId) throw new Error('Menu item id is required')

  const row = buildRow(patch)

  const { data, error } = await retryWithMissingColumnFallback(
    row,
    async (payload) =>
      supabase.from(MENU_TABLE).update(payload).eq('id', resolvedId).select('*').maybeSingle(),
    { label: 'UPDATE MENU ITEM' },
  )

  if (error) {
    throw new Error(`Failed to update menu item ${resolvedId}: ${error.message}`)
  }

  return clone(mapRow(data))
}

export async function deleteMenuItem(id) {
  const resolvedId = String(id || '').trim()
  if (!resolvedId) throw new Error('Menu item id is required')

  const { error } = await supabase.from(MENU_TABLE).delete().eq('id', resolvedId)

  if (error) {
    throw new Error(`Failed to delete menu item ${resolvedId}: ${error.message}`)
  }

  return { ok: true, id: resolvedId }
}

export async function uploadMenuImage(base64Data, fileName = 'menu.jpg') {
  if (!base64Data) return null

  const matches = String(base64Data).match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Format gambar tidak valid, gunakan file image (base64 data URL)')
  }

  const contentType = matches[1]
  const buffer = Buffer.from(matches[2], 'base64')
  const extension = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
  const safeName = String(fileName || 'menu').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40)
  const path = `${Date.now()}-${safeName}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(path, buffer, { contentType, upsert: true })

  if (uploadError) {
    throw new Error(`Gagal upload gambar: ${uploadError.message}`)
  }

  const { data } = supabase.storage.from('menu-images').getPublicUrl(path)
  return data?.publicUrl || null
}
