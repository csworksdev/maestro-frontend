# Maestro Hub Frontend

Frontend untuk Maestro Hub (Maestro Swim Management System) yang melayani
dashboard multi-peran dan operasional harian. Routing ditentukan oleh subdomain
agar setiap peran punya entry point sendiri.

## Fitur utama
- Dashboard penjualan, operasional (okupansi + daily), keuangan, CEO, dan CFO.
- Manajemen order, cek jadwal, absensi pelatih, dan pengajuan izin.
- Master data siswa, pelatih, produk, paket, periode, kolam, cabang, spesialisasi.
- Broadcast, promo, dan follow-up perpanjang.
- Integrasi pembayaran/invoice (Xendit) dan notifikasi (Firebase FCM).
- Realtime chart melalui WebSocket hooks.

## Role & akses subdomain
Aplikasi memilih rute berdasarkan subdomain di `src/App.jsx`.

- Admin: `http://admin.localhost:5173`
- Coach: `http://coach.localhost:5173`
- Finance: `http://finance.localhost:5173`
- Opx: `http://opx.localhost:5173`
- Chief: `http://chief.localhost:5173`

Jika `*.localhost` belum resolve ke `127.0.0.1`, tambahkan ke `hosts` lokal.

## Tech stack
- React 18 + Vite
- Tailwind CSS + Sass
- React Router, Redux Toolkit, React Query
- ApexCharts, Recharts, Chart.js
- Firebase (FCM), WebSocket untuk dashboard realtime

## Struktur direktori (ringkas)
- `src/layout/routes` - rute berdasarkan role/subdomain
- `src/pages` - halaman fitur
- `src/constant/data.js` - menu per role
- `src/hooks` - socket dan utilitas data realtime

## Getting started
1. Install dependencies: `pnpm install`
2. Jalankan dev server:
   - `pnpm dev` (localhost biasa)
   - `pnpm host` (akses subdomain `*.localhost`)
   - `pnpm start-admin` atau `pnpm start-coach` (host + port khusus)

## Scripts
- `pnpm dev` - dev server
- `pnpm host` - dev server dengan host terbuka
- `pnpm build` - build produksi ke `dist`
- `pnpm preview` - preview build
- `pnpm test` / `pnpm test:run` - unit tests (Vitest)

## Build & deploy
- Output build ada di `dist`.
- Konfigurasi environment ada di `.env`, `.env.development`, `.env.production`.
