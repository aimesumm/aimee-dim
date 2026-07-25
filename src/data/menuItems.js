
// Data cadangan yang dipakai jika backend menu (Supabase) belum terisi atau
// gagal diakses. Halaman utama akan mengambil data dari /api/menu-list lebih
// dulu; daftar ini hanya fallback supaya halaman tidak pernah kosong/error.
// Hanya menu dengan `hasVariantPage: true` yang membuka halaman pilih varian
// saat tombol Add ditekan. Menu lain langsung masuk ke keranjang.

export const MENU_PLACEHOLDER_IMAGE = '/placeholder.png'
export const fallbackMenuItems = [
  {
    id: 'd1',
    name: 'Dimsum Original',
    category: 'Dimsum',
    price: 15000,
    desc: 'Dimsum ayam original dengan tekstur lembut.',
    badge: 'Best Seller',
    emoji: '🥟',
    image: MENU_PLACEHOLDER_IMAGE,
    hasVariantPage: true,
    variantOptions: [
      { key: 'naori', label: 'Naori', price: 1000 },
      { key: 'chili-oil', label: 'Chili Oil', price: 1000 },
      { key: 'saus-mentai', label: 'Saus Mentai', price: 5000 },
      { key: 'saus-mentai-hot', label: 'Saus Mentai Hot', price: 6000 },
    ],
  },
  {
    id: 'd2',
    name: 'Dimsum Ayam Pedas',
    category: 'Dimsum',
    price: 19000,
    desc: 'Pedas ringan dengan rasa mantap.',
    badge: 'Spicy',
    emoji: '🌶️',
    image: MENU_PLACEHOLDER_IMAGE,
  },
  {
    id: 'd3',
    name: 'Dimsum Keju',
    category: 'Dimsum',
    price: 20000,
    desc: 'Creamy dan lumer.',
    badge: 'Cheese',
    emoji: '🧀',
    image: MENU_PLACEHOLDER_IMAGE,
  },
  {
    id: 'd4',
    name: 'Dimsum Udang',
    category: 'Dimsum',
    price: 22000,
    desc: 'Udang fresh dan lembut.',
    badge: 'Premium',
    emoji: '🦐',
    image: MENU_PLACEHOLDER_IMAGE,
  },
  {
    id: 'm1',
    name: 'Mojito Lime',
    category: 'Minuman',
    price: 15000,
    desc: 'Segar dan ringan.',
    badge: 'Fresh',
    emoji: '🍋‍🟩',
    image: MENU_PLACEHOLDER_IMAGE,
  },
  {
    id: 'm2',
    name: 'Mojito Strawberry',
    category: 'Minuman',
    price: 16000,
    desc: 'Manis-asam seimbang.',
    badge: 'Popular',
    emoji: '🍓',
    image: MENU_PLACEHOLDER_IMAGE,
  },
]
