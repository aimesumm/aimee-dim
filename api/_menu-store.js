import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { MENU_PLACEHOLDER_IMAGE, fallbackMenuItems } from '../src/data/menuItems.js'
import { nowIso } from './_shared.js'

const MENU_TABLE = 'menu_items'
const LOCAL_STORE_PATH = process.env.MENU_STORE_PATH || path.join(os.tmpdir(), 'aime-dimsum-menu-items.json')

let localStoreCache = null
let supabaseClientPromise = null

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

function isMenuBackendUnavailable(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return (
    message.includes('schema cache') ||
    message.includes(`public.${MENU_TABLE}`) ||
    message.includes(MENU_TABLE) ||
    (message.includes('relation') && message.includes('does not exist')) ||
    message.includes('could not find the table') ||
    message.includes('supabase environment variables are missing') ||
    message.includes('supabase client unavailable') ||
    (message.includes('storage') && message.includes('not found'))
  )
}

async function getSupabaseClient() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = import('../lib/supabase.js')
      .then((mod) => mod.supabase || null)
      .catch(() => null)
  }

  return supabaseClientPromise
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
    imageUrl: row.image_url || MENU_PLACEHOLDER_IMAGE,
    badge: row.badge || '',
    description: row.description || '',
    hasVariant: Boolean(row.has_variant),
    variants: normalizeVariants(row.variants),
    sortOrder: toNumber(row.sort_order, 0),
    createdAt: row.created_at || nowIso(),
    updatedAt: row.updated_at || nowIso(),
  }
}

function buildRow(item = {}, existing = null) {
  const existingVariants = normalizeVariants(existing?.variants)
  const nextVariants = item.variants !== undefined ? normalizeVariants(item.variants) : existingVariants
  const hasVariant = item.hasVariant !== undefined ? Boolean(item.hasVariant) : Boolean(existing?.has_variant ?? existing?.hasVariant)

  return {
    name: String(item.name ?? existing?.name ?? '').trim(),
    category: item.category === 'Minuman' || existing?.category === 'Minuman' ? 'Minuman' : 'Makanan',
    price: toNumber(item.price ?? existing?.price, 0),
    image_url: item.imageUrl ?? existing?.image_url ?? existing?.imageUrl ?? MENU_PLACEHOLDER_IMAGE,
    badge: item.badge !== undefined ? (item.badge || null) : (existing?.badge || null),
    description: item.description !== undefined ? (item.description || null) : (existing?.description || null),
    has_variant: hasVariant,
    variants: nextVariants,
    sort_order: item.sortOrder !== undefined ? toNumber(item.sortOrder, toNumber(existing?.sort_order, 0)) : toNumber(existing?.sort_order, 0),
    updated_at: nowIso(),
  }
}

function seedLocalRows() {
  return fallbackMenuItems.map((item, index) => ({
    id: String(item.id || randomUUID()),
    name: item.name || '',
    category: item.category === 'Minuman' ? 'Minuman' : 'Makanan',
    price: toNumber(item.price, 0),
    image_url: item.imageUrl || item.image || MENU_PLACEHOLDER_IMAGE,
    badge: item.badge || null,
    description: item.desc || item.description || null,
    has_variant: Boolean(item.hasVariantPage || item.hasVariant),
    variants: normalizeVariants(item.variantOptions || item.variants || []),
    sort_order: toNumber(item.sortOrder, index),
    created_at: nowIso(),
    updated_at: nowIso(),
  }))
}

async function readLocalRows() {
  if (Array.isArray(localStoreCache)) {
    return clone(localStoreCache)
  }

  try {
    const raw = await fs.readFile(LOCAL_STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      localStoreCache = parsed
      return clone(parsed)
    }
  } catch {
    // fall through to seed
  }

  const seeded = seedLocalRows()
  localStoreCache = seeded
  await writeLocalRows(seeded)
  return clone(seeded)
}

async function writeLocalRows(rows) {
  localStoreCache = clone(rows)
  await fs.mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true })
  await fs.writeFile(LOCAL_STORE_PATH, JSON.stringify(localStoreCache, null, 2), 'utf8')
}

async function querySupabase(handler) {
  const supabase = await getSupabaseClient()
  if (!supabase) return { error: new Error('Supabase client unavailable') }
  return handler(supabase)
}

async function seedSupabaseMenuItems(supabase) {
  const { data: existingRows, error: selectError } = await supabase
    .from(MENU_TABLE)
    .select('id')
    .limit(1)

  if (selectError) {
    throw selectError
  }

  if (Array.isArray(existingRows) && existingRows.length > 0) {
    return false
  }

  const seedRows = seedLocalRows().map(({ id, created_at, updated_at, ...row }) => ({
    ...row,
    created_at,
    updated_at,
  }))

  const { error: insertError } = await supabase.from(MENU_TABLE).insert(seedRows)
  if (insertError) {
    throw insertError
  }

  return true
}

export async function listMenuItems() {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      throw new Error('Supabase client unavailable')
    }

    const { data, error } = await supabase
      .from(MENU_TABLE)
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      await seedSupabaseMenuItems(supabase)
      const retry = await supabase
        .from(MENU_TABLE)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (retry.error) {
        throw retry.error
      }

      return clone((retry.data || []).map(mapRow))
    }

    return clone(data.map(mapRow))
  } catch (error) {
    if (!isMenuBackendUnavailable(error)) {
      throw new Error(`Failed to load menu items: ${error.message}`)
    }

    const localRows = await readLocalRows()
    return clone(localRows.map(mapRow))
  }
}

export async function createMenuItem(item = {}) {
  const row = buildRow(item)

  try {
    const result = await querySupabase((supabase) =>
      supabase
        .from(MENU_TABLE)
        .insert({
          name: row.name,
          category: row.category,
          price: row.price,
          image_url: row.image_url,
          badge: row.badge,
          description: row.description,
          has_variant: row.has_variant,
          variants: row.variants,
          sort_order: row.sort_order,
          updated_at: row.updated_at,
        })
        .select('*')
        .single(),
    )

    if (result.error) {
      throw result.error
    }

    return clone(mapRow(result.data))
  } catch (error) {
    if (!isMenuBackendUnavailable(error)) {
      throw new Error(`Failed to create menu item: ${error.message}`)
    }

    const localRows = await readLocalRows()
    const storedRow = {
      id: String(item.id || randomUUID()),
      ...row,
      created_at: nowIso(),
    }

    const nextRows = [...localRows, storedRow]
    await writeLocalRows(nextRows)
    return clone(mapRow(storedRow))
  }
}

export async function updateMenuItem(id, patch = {}) {
  const resolvedId = String(id || '').trim()
  if (!resolvedId) throw new Error('Menu item id is required')

  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      throw new Error('Supabase client unavailable')
    }

    const { data: existing, error: fetchError } = await supabase
      .from(MENU_TABLE)
      .select('*')
      .eq('id', resolvedId)
      .maybeSingle()

    if (fetchError) {
      throw fetchError
    }

    if (!existing) {
      return null
    }

    const merged = buildRow(patch, existing)

    const { data, error } = await supabase
      .from(MENU_TABLE)
      .update(merged)
      .eq('id', resolvedId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw error
    }

    return clone(mapRow(data))
  } catch (error) {
    if (!isMenuBackendUnavailable(error)) {
      throw new Error(`Failed to update menu item ${resolvedId}: ${error.message}`)
    }

    const localRows = await readLocalRows()
    const index = localRows.findIndex((row) => String(row.id) === resolvedId)
    if (index < 0) return null

    const updatedRow = {
      ...localRows[index],
      ...buildRow(patch, localRows[index]),
      id: resolvedId,
      updated_at: nowIso(),
      created_at: localRows[index].created_at || nowIso(),
    }

    const nextRows = [...localRows]
    nextRows[index] = updatedRow
    await writeLocalRows(nextRows)
    return clone(mapRow(updatedRow))
  }
}

export async function deleteMenuItem(id) {
  const resolvedId = String(id || '').trim()
  if (!resolvedId) throw new Error('Menu item id is required')

  try {
    const result = await querySupabase((supabase) =>
      supabase.from(MENU_TABLE).delete().eq('id', resolvedId),
    )

    if (result.error) {
      throw result.error
    }

    return { ok: true, id: resolvedId }
  } catch (error) {
    if (!isMenuBackendUnavailable(error)) {
      throw new Error(`Failed to delete menu item ${resolvedId}: ${error.message}`)
    }

    const localRows = await readLocalRows()
    const nextRows = localRows.filter((row) => String(row.id) !== resolvedId)
    await writeLocalRows(nextRows)
    return { ok: true, id: resolvedId, fallback: true }
  }
}

export async function uploadMenuImage(base64Data, fileName = 'menu.jpg') {
  if (!base64Data) return null

  const input = String(base64Data)
  const matches = input.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/)
  if (!matches) {
    return input
  }

  const contentType = matches[1]
  const buffer = Buffer.from(matches[2], 'base64')
  const extension = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
  const safeName = String(fileName || 'menu').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40)
  const pathName = `${Date.now()}-${safeName}.${extension}`

  try {
    const supabase = await getSupabaseClient()
    if (!supabase?.storage) {
      return input
    }

    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(pathName, buffer, { contentType, upsert: true })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from('menu-images').getPublicUrl(pathName)
    return data?.publicUrl || input
  } catch (error) {
    if (isMenuBackendUnavailable(error)) {
      return input
    }
    throw new Error(`Gagal upload gambar: ${error.message}`)
  }
}
