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
- `pnpm build:dev` - build statis DEV untuk Netlify ke `dist`
- `pnpm preview` - preview build
- `pnpm test` / `pnpm test:run` - unit tests (Vitest)

## Build & deploy
- Output build ada di `dist`.
- Konfigurasi environment ada di `.env`, `.env.development`, `.env.production`.

## Memilih backend saat development

Vite membaca `.env` untuk pengaturan bersama, lalu menimpanya dengan file sesuai
mode. Gunakan nama variabel yang sama di setiap mode; `VITE_DEV_*` tidak digunakan.

| Perintah | File environment | Backend default |
| --- | --- | --- |
| `npm run dev` / `npm run start-admin` / `npm run start-coach` | `.env` + `.env.development` | DEV (`api-dev.maestroswim.com`) |
| `npm run build:dev` | `.env` + `.env.development` | DEV (`api-dev.maestroswim.com`) |
| `npm run build` | `.env` + `.env.production` | Production |

Untuk memakai backend lokal, buat `.env.development.local`:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
VITE_ACCESS_API_URL=http://127.0.0.1:8000
VITE_API_WS=ws://127.0.0.1:8001
```

Sesuaikan port dengan backend lokal. `VITE_ACCESS_API_URL` dapat dihapus untuk
mengikuti `VITE_API_URL`. Koneksi database diatur oleh backend tujuan.

Untuk sementara memakai backend lain saat frontend berjalan lokal, buat
`.env.development.local` berisi alamat API dan WebSocket tujuan dengan nama
variabel yang sama. File ini menimpa `.env.development`; hapus override tersebut
untuk kembali memakai backend DEV. Restart Vite setiap kali mengubah environment.

Proxy `/__api`, `/__access-api`, dan proxy file hanya dipakai oleh dev server
pada `localhost`, `*.localhost`, atau loopback. Build statis DEV dan PROD memakai
alamat API absolut; Netlify tidak memerlukan rewrite API.

## Deployment DEV Netlify

`netlify.toml` memilih `npm run build:dev` khusus branch `dev`, dengan
`VITE_API_URL` dan `VITE_ACCESS_API_URL` bernilai
`https://api-dev.maestroswim.com`. Konfigurasi build default production tetap
`npm run build` dan `.env.production` tetap memakai `https://api.maestroswim.com`.
Pastikan site DEV dibangun dari branch `dev` dan domain
`admin.dev.maestroswim.com` terpasang pada site tersebut. Jika site DEV memakai
branch lain, tambahkan context khusus nama branch itu dengan konfigurasi DEV
yang sama; jangan mengganti `[build]` global.

Resolver terpusat di `src/utils/apiUrl.js` juga mengarahkan seluruh host
`*.dev.maestroswim.com` ke API DEV, termasuk jika artifact production dipakai
pada domain DEV. Build menolak URL API kosong/relatif dan build DEV menolak
backend selain `api-dev.maestroswim.com`. Override lokal tetap bisa dipakai
melalui dev server. Variabel environment dibaca saat build; perubahan memerlukan
build dan deploy ulang. Build DEV tetap menggunakan React production runtime.

Validasi setelah deploy melalui Network Inspector:

- Login: `POST https://api-dev.maestroswim.com/auth/users/login_v2/`.
- Refresh token: `POST https://api-dev.maestroswim.com/auth/token/refresh/`.
- Request modul bisnis: `https://api-dev.maestroswim.com/api/...`.
- Tidak ada request API ke domain frontend atau prefix `/__api`.

Media tetap menggunakan host media yang sudah dikonfigurasi. Endpoint contoh
RTK Query (shop/calendar/register) memakai API DEV pada deployment DEV; base URL
legacy production tetap dipertahankan. Endpoint contoh tersebut perlu dukungan
backend tersendiri dan bukan alur login utama Maestro.

CORS dikelola backend: origin `https://admin.dev.maestroswim.com` harus diizinkan
untuk method/header yang digunakan, termasuk `Authorization` dan `Content-Type`.
Frontend tetap memakai JWT dan `withCredentials: false`; tidak ada perubahan
konfigurasi CORS atau backend dalam perbaikan ini.

File `.env*` saat ini diabaikan Git. Konfigurasi URL HTTP dan WebSocket DEV
untuk Netlify disimpan pada context branch `dev`; pengaturan bersama lain
(misalnya Firebase dan media) tetap harus tersedia di environment Netlify.
URL production tetap mengikuti environment production yang sudah digunakan.

Jika Netlify melaporkan URL API sebagai secret, `SECRETS_SCAN_OMIT_KEYS` pada
`netlify.toml` mengecualikan hanya `VITE_API_URL`, `VITE_ACCESS_API_URL`, dan
`VITE_API_WS`. Ketiganya berisi alamat backend publik yang memang diperlukan
browser. Secret scanning tetap aktif untuk variabel lainnya; jangan menambahkan
token, password, atau credential ke daftar pengecualian ini.

Referensi: [Vite environment dan mode](https://vite.dev/guide/env-and-mode),
[Netlify configuration contexts](https://docs.netlify.com/build/configure-builds/file-based-configuration/#deploy-contexts).
