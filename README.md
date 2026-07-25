# AIME-Dimsum

Project ini dirapikan supaya layout lebih klasik, elegan, dan nyaman di mobile, tanpa mengubah alur backend utama.

## Alur utama

Home → Menu → Keranjang → Data pelanggan → Checkout → QRIS / Tunai → Status pembayaran → Konfirmasi owner → WhatsApp setelah berhasil

## Yang dirapikan

- Struktur tampilan home dibuat lebih rapi dan konsisten
- Layout mobile diperhalus agar tidak pecah di Android dan iPhone
- Animasi transisi ditingkatkan dengan Framer Motion
- Scroll dibuat lebih halus dengan Lenis
- Hero diberi animasi sinematik dengan GSAP
- File yang tidak terpakai dibuang agar project lebih ringan

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

Tidak ada perubahan fungsi backend inti. Yang berubah hanya tampilan frontend dan struktur file yang tidak penting.

## Struktur frontend

- `src/pages/Home.jsx` — halaman utama
- `src/pages/Checkout.jsx` — pemilihan metode pembayaran
- `src/pages/PaymentGateway.jsx` — halaman QRIS / tunai dan status
- `src/pages/PaymentSuccess.jsx` — halaman berhasil
- `src/components/*` — komponen UI yang dipakai bersama
- `src/styles/base.css` — seluruh styling utama

## Environment variables

### Frontend
- `VITE_OWNER_WHATSAPP`
- `VITE_TELEGRAM_BOT_USERNAME`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Backend
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `QRIS_DATA`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `APP_BASE_URL` atau `SITE_URL`

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

## Catatan penghubungan backend

Frontend memanggil API berikut:

- `POST /api/create-order`
- `POST /api/create-qris`
- `GET /api/orders/:orderId/status`
- `POST /api/orders/:orderId/confirm`
- `GET /api/check-payment?orderId=...`
- `POST /api/update-order-status`

Jika project dijalankan di Vercel, `vercel.json` tetap mempertahankan rewrite supaya semua route frontend masuk ke `index.html`, sedangkan API tetap berjalan di folder `api`.

## File yang dibersihkan

Beberapa file legacy yang tidak dipakai lagi sudah dihapus untuk merapikan project, termasuk file style duplikat dan komponen/page lama yang tidak terpakai di alur baru.

## Fitur Admin (Kelola Menu)

Ditambahkan tanpa mengubah alur checkout/pembayaran yang sudah ada:

- Ikon **⋮** di header membuka Profile Menu (bottom sheet): Login Account, Social Media, Contact Us.
- `Login Account` → `/admin/login` (hanya password) → jika benar masuk ke `/admin/dashboard`.
- Dashboard admin menampilkan seluruh menu; klik salah satu untuk edit, atau klik "➕ Tambah Menu" untuk menambah.
- Form menu: upload gambar, nama, harga, kategori (Makanan/Minuman), deskripsi, badge, dan varian opsional (checkbox "Menggunakan Varian" + baris nama/harga varian yang bisa ditambah/dihapus).
- Halaman utama mengambil data menu dari `GET /api/menu-list`. Jika backend/tabel belum siap, halaman otomatis memakai data bawaan di `src/data/menuItems.js` supaya tidak pernah error/kosong.

### Endpoint baru (tidak mengubah endpoint order yang sudah ada)

- `GET /api/menu-list` — publik, daftar menu.
- `POST /api/menu-create` — admin only (header `x-admin-token`).
- `PATCH /api/menu-update` — admin only.
- `DELETE /api/menu-delete` — admin only.
- `POST /api/admin-login` — cek password, mengembalikan token.

### Environment variable tambahan

- `ADMIN_PASSWORD` (backend) — password login admin. Default `admindimsum` jika tidak diset; **wajib diganti** sebelum deploy produksi.
- `VITE_INSTAGRAM_URL`, `VITE_INSTAGRAM_HANDLE`
- `VITE_TIKTOK_URL`, `VITE_TIKTOK_HANDLE`
- `VITE_FACEBOOK_URL`, `VITE_FACEBOOK_HANDLE`
- `VITE_CONTACT_EMAIL`
- `VITE_OWNER_WHATSAPP` (sudah ada) dipakai juga untuk tombol WhatsApp di Contact Us.

Ikon sosial media hanya muncul jika URL-nya diisi.

### Migrasi database & storage

Jalankan `supabase/migrations/20260726_add_menu_items.sql` di Supabase SQL editor. File ini:

- Membuat tabel baru `menu_items` (tidak menyentuh tabel `orders`).
- Mencoba membuat storage bucket publik `menu-images` untuk gambar menu. Jika baris `insert into storage.buckets ...` gagal (tergantung kebijakan project Anda), buat bucket publik bernama `menu-images` secara manual lewat tab Storage di dashboard Supabase.

Jika tabel `menu_items` belum ada / kosong, halaman utama tetap tampil normal memakai data bawaan — fitur pemesanan, checkout, QRIS, dan Telegram tidak terpengaruh sama sekali.
