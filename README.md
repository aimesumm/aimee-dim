# AIME-Dimsum

Project ini dirapikan supaya alur menu, admin, dan pembayaran tetap stabil di mobile, dengan tema maroon yang lebih tegas.

## Alur utama

Home → Menu → Keranjang → Data pelanggan → Checkout → QRIS / Tunai → Status pembayaran → Konfirmasi owner → WhatsApp setelah berhasil

## Fitur utama yang tersedia

- Menu utama punya filter kategori: Semua, Makanan, Minuman, Lainnya, dan Paket
- Admin dashboard bisa tambah, edit, dan hapus menu
- Form admin mendukung kategori menu baru saat membuat atau mengubah item
- Tema warna diganti dari sakura menjadi merah maroon
- Alur QRIS dibuat lebih stabil supaya gambar tidak cepat hilang saat data order di-refresh
- File JSX yang tidak dipakai sudah dibersihkan agar project lebih ringan

## Backend yang tetap dipakai

Folder backend tetap menggunakan API dan Supabase yang sudah ada:

- `api/_shared.js`
- `api/_store.js`
- `api/create-order.js`
- `api/create-qris.js`
- `api/check-payment.js`
- `api/orders/[orderId]/status.js`
- `api/orders/[orderId]/confirm.js`
- `api/update-order-status.js`
- `api/telegram-webhook.js`

Tidak ada perubahan struktur backend inti. Yang diperbarui terutama adalah frontend, normalisasi kategori menu, dan penyimpanan QRIS agar tidak mudah tertimpa refresh data.

## Struktur frontend

- `src/pages/MenuPage.jsx` — halaman utama
- `src/pages/OrderPage.jsx` — checkout
- `src/pages/PaymentPage.jsx` — halaman QRIS / tunai dan status
- `src/pages/PaymentSuccess.jsx` — halaman berhasil
- `src/components/*` — komponen UI yang dipakai bersama
- `src/styles/base.css` — seluruh styling utama

## Environment variables

Buat file `.env` di root project lalu isi variabel berikut sesuai kebutuhan.

### Frontend
```env
VITE_OWNER_WHATSAPP=628xxxxxxxxxx
VITE_CONTACT_EMAIL=admin@domain.com
VITE_TELEGRAM_BOT_USERNAME=namabot
VITE_INSTAGRAM_HANDLE=@aime_dimsum
VITE_INSTAGRAM_URL=https://instagram.com/aime_dimsum
VITE_TIKTOK_HANDLE=@aime_dimsum
VITE_TIKTOK_URL=https://tiktok.com/@aime_dimsum
VITE_FACEBOOK_HANDLE=AIME Dimsum
VITE_FACEBOOK_URL=https://facebook.com/aime_dimsum
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key
```

### Backend / serverless
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_PASSWORD=your_admin_password
QRIS_DATA=your_qris_static_payload
TELEGRAM_BOT_TOKEN=123456:ABCDEF
TELEGRAM_CHAT_ID=123456789
APP_BASE_URL=https://your-domain.com
SITE_URL=https://your-domain.com
```

Catatan:
- `APP_BASE_URL` atau `SITE_URL` dipakai untuk webhook Telegram.
- `QRIS_DATA` wajib diisi agar generator QRIS bisa membuat kode pembayaran.
- `SUPABASE_SERVICE_ROLE_KEY` hanya untuk backend. Jangan taruh key ini di frontend.

## Cara menyiapkan environment

1. Buat file `.env` di root project.
2. Isi variabel frontend dan backend sesuai blok di atas.
3. Pastikan Supabase URL dan key sudah benar.
4. Pastikan `ADMIN_PASSWORD` sama dengan password yang ingin dipakai login admin.
5. Jalankan project dengan `npm install` lalu `npm run dev`.
6. Jika deploy ke Vercel atau server lain, masukkan env yang sama ke dashboard hosting.

## Supabase table

Pastikan tabel `orders` memiliki kolom minimal:

- `order_id`
- `customer_name`
- `customer_phone`
- `note`
- `items`
- `item_count`
- `subtotal`
- `total`
- `payment_method`
- `payment_status`
- `telegram_message_id`
- `confirmed_at`
- `qris`
- `created_at`
- `updated_at`

Untuk menu, pastikan tabel `menu_items` memiliki kolom minimal:

- `id`
- `name`
- `category`
- `price`
- `image_url`
- `image_path`
- `badge`
- `description`
- `has_variant`
- `variants`
- `sort_order`
- `created_at`
- `updated_at`

## Supabase Storage bucket

Simpan gambar menu di bucket `menu-images`.

- Folder otomatis mengikuti kategori menu, misalnya `makanan/`, `minuman/`, `lainnya/`, atau `paket/`
- Saat menu dibuat, gambar diupload dulu lalu `image_url` dan `image_path` disimpan ke tabel `menu_items`
- Saat menu diedit dan gambar diganti, file lama dihapus best-effort supaya tidak mengganggu penyimpanan utama
- Saat menu dihapus, file lama juga dihapus best-effort agar data tetap rapi

## File yang sudah tidak dipakai

Beberapa file JSX legacy yang tidak terpakai sudah dihapus dari project agar tidak memicu error atau membebani build.

