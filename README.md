# AIME-Dimsum

Project ini sekarang memakai **Midtrans QRIS** untuk pembayaran, tanpa mengubah gaya tampilan utama. Alur konfirmasi manual sudah diganti dengan webhook Midtrans, lalu order sukses dikirim otomatis ke WhatsApp admin lewat integrasi Baileys bridge.

## Alur utama

Home → Menu → Keranjang → Data pelanggan → Checkout → QRIS Midtrans → Status pembayaran → WhatsApp admin

## Yang berubah

- Generator QRIS lama diganti ke **Midtrans Snap QRIS**
- Tombol/flow konfirmasi manual dihapus
- Saat pembayaran sukses, order otomatis diproses ke **WhatsApp admin**
- Tampilan UI tetap dipertahankan, yang berubah hanya cara kerja pembayaran

## Catatan penting

Midtrans Snap memang dibuat untuk membuka halaman pembayaran sebagai pop-up atau redirect, dan pembayaran bisa dibatasi ke metode tertentu lewat `enabled_payments`. Untuk QRIS, Midtrans juga menyediakan webhook/notifikasi server saat transaksi berubah status. citeturn995302search3turn301479search0turn995302search1turn995302search2

## Backend yang dipakai

Folder backend sekarang memakai endpoint berikut:

- `api/create-order.js`
- `api/create-qris.js` → membuat Snap token Midtrans QRIS
- `api/midtrans-webhook.js` → menerima notifikasi pembayaran dari Midtrans
- `api/orders/[orderId]/status.js`
- `api/update-order-status.js`
- `api/menu-list.js`
- `api/menu-create.js`
- `api/menu-update.js`
- `api/menu-delete.js`

Endpoint konfirmasi manual seperti Telegram sudah dinonaktifkan.

## Environment variables

Buat file `.env` di root project.

### Frontend
```env
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
VITE_MIDTRANS_IS_PRODUCTION=false
VITE_OWNER_WHATSAPP=628xxxxxxxxxx
VITE_CONTACT_EMAIL=admin@domain.com
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
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_IS_PRODUCTION=false
APP_BASE_URL=https://your-domain.com
SITE_URL=https://your-domain.com
WHATSAPP_BAILEYS_API_URL=https://your-baileys-bridge.example/api/send-message
WHATSAPP_BAILEYS_API_KEY=optional-secret
WHATSAPP_ADMIN_NUMBER=628xxxxxxxxxx
```

## Cara kerja payment baru

1. User checkout seperti biasa.
2. Backend membuat order dengan status `pending`.
3. Frontend meminta Snap token Midtrans dari `api/create-qris`.
4. Token Snap dibuka di halaman payment.
5. Midtrans mengirim webhook ke `api/midtrans-webhook` saat status transaksi berubah.
6. Kalau status `settlement` atau `capture`, order diupdate menjadi `paid`.
7. Setelah itu, project memanggil bridge WhatsApp berbasis Baileys untuk mengirim detail order ke admin. Midtrans memang menyarankan penggunaan notification/webhook backend untuk memproses order setelah pembayaran selesai, dan status transaksi bisa diverifikasi lewat status API. citeturn995302search13turn995302search12turn995302search9

## Catatan untuk Baileys

Baileys perlu berjalan di service yang hidup terus, jadi paling aman dijalankan di VPS atau server lain, lalu project ini hanya memanggil endpoint bridge tersebut. File backend sudah disiapkan supaya bisa mengirim payload order ke endpoint itu.

## Jalankan project

```bash
npm install
npm run dev
```

## Deploy

1. Isi semua env di Vercel / hosting.
2. Pastikan `MIDTRANS_SERVER_KEY` dan `VITE_MIDTRANS_CLIENT_KEY` benar.
3. Set URL webhook Midtrans ke:
   `https://domain-kamu/api/midtrans-webhook`
4. Pastikan endpoint bridge WhatsApp/Baileys aktif.
5. Deploy ulang project.
