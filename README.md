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
