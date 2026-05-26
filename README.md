# Event Ops Manager - Deployment Guide

Panduan ini menjelaskan cara menjalankan aplikasi Event Ops Manager di server/laptop lain menggunakan Nuxt/Nitro, PM2, PostgreSQL, Prisma, dan Cloudflare Tunnel.

---

## 1. Environment Variables

Project ini membutuhkan file `.env`.

Jangan push file `.env` asli ke GitHub. Gunakan `.env.example` sebagai template.

### `.env.example`

Lokasi file:

```bash
.env.example
```

Isi yang aman untuk GitHub:

```env
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>"
NUXT_SESSION_PASSWORD="replace_with_random_min_32_characters"
```

Contoh format development lokal:

```env
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@localhost:<DB_PORT>/<DB_NAME>"
NUXT_SESSION_PASSWORD="replace_with_random_min_32_characters"
```

Catatan:

- `.env.example` hanya contoh format.
- Jangan gunakan password database asli di `.env.example`.
- Jangan gunakan `NUXT_SESSION_PASSWORD` asli di `.env.example`.
- Jangan commit file `.env` asli ke GitHub.

Pastikan `.gitignore` memiliki aturan berikut:

```gitignore
.env
.env.*
!.env.example
```

---

## 2. Membuat `.env` Saat Deploy

Masuk ke folder project:

```bash
cd <PROJECT_FOLDER>
```

Contoh:

```bash
cd ~/apps/<PROJECT_NAME>
```

Copy `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit file `.env`:

```bash
nano .env
```

Isi sesuai server/laptop yang digunakan.

Contoh `.env` lokal:

```env
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@localhost:<DB_PORT>/<DB_NAME>"
NUXT_SESSION_PASSWORD="<RANDOM_SESSION_PASSWORD>"
```

---

## 3. Generate `NUXT_SESSION_PASSWORD`

`NUXT_SESSION_PASSWORD` dibutuhkan oleh auth/session Nuxt.

Jika kosong atau tidak terbaca oleh PM2, login bisa gagal dan muncul error:

```txt
HBError: Empty password
```

Generate password baru:

```bash
openssl rand -base64 48
```

Masukkan hasilnya ke `.env`:

```env
NUXT_SESSION_PASSWORD="<GENERATED_PASSWORD_FROM_OPENSSL>"
```

Jangan gunakan value contoh untuk production.

---

## 4. Install Dependency dan Build App

Install dependency:

```bash
npm install
```

Build Nuxt app:

```bash
npm run build
```

Pastikan output build tersedia:

```bash
ls -la .output/server/index.mjs
```

---

## 5. Setup Prisma dan Database

Generate Prisma client:

```bash
npx prisma generate
```

Jalankan migration production:

```bash
npx prisma migrate deploy
```

Jika project membutuhkan seed data/demo account:

```bash
npx prisma db seed
```

---

## 6. Menjalankan App dengan PM2

Bagian ini penting.

PM2 tidak selalu otomatis membaca isi file `.env`. Karena itu, sebelum start/restart app, export isi `.env` terlebih dahulu:

```bash
set -a
source .env
set +a
```

Jika app belum pernah dibuat di PM2:

```bash
pm2 start .output/server/index.mjs --name <PM2_APP_NAME>
```

Jika app sudah pernah ada:

```bash
pm2 restart <PM2_APP_NAME> --update-env
```

Simpan konfigurasi PM2:

```bash
pm2 save
```

Cek status:

```bash
pm2 status
```

App harus berstatus:

```txt
online
```

---

## 7. Cek Apakah Env Sudah Masuk ke PM2

Jangan tampilkan isi secret. Cek cukup seperti ini:

```bash
pm2 env <PM2_APP_ID> | grep -q NUXT_SESSION_PASSWORD && echo "OK: NUXT_SESSION_PASSWORD masuk" || echo "BELUM MASUK"
```

Contoh jika app berada di PM2 ID `0`:

```bash
pm2 env 0 | grep -q NUXT_SESSION_PASSWORD && echo "OK: NUXT_SESSION_PASSWORD masuk" || echo "BELUM MASUK"
```

Jika hasilnya:

```txt
OK: NUXT_SESSION_PASSWORD masuk
```

berarti aman.

Jika hasilnya:

```txt
BELUM MASUK
```

jalankan ulang:

```bash
set -a
source .env
set +a
pm2 restart <PM2_APP_NAME> --update-env
```

---

## 8. Test App Lokal

Cek apakah app hidup di port aplikasi:

```bash
curl -i http://localhost:<APP_PORT>
```

Lalu cek session auth:

```bash
curl -i http://localhost:<APP_PORT>/api/_auth/session
```

Target response:

```txt
HTTP/1.1 200 OK
```

Jika muncul error:

```txt
HBError: Empty password
```

berarti `NUXT_SESSION_PASSWORD` belum terbaca oleh proses PM2.

Solusinya:

```bash
set -a
source .env
set +a
pm2 restart <PM2_APP_NAME> --update-env
```

---

## 9. Test Login API

Cek endpoint login langsung dari server:

```bash
curl -i -X POST http://localhost:<APP_PORT>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}'
```

Jika terjadi error `500`, cek log PM2:

```bash
pm2 logs <PM2_APP_NAME> --lines 100
```

---

## 10. Setup Cloudflare Tunnel

Jika app lokal sudah aman, baru hubungkan ke domain menggunakan Cloudflare Tunnel.

Masuk ke Cloudflare:

```txt
Zero Trust
→ Networks
→ Tunnels
→ pilih tunnel
→ Published application routes
→ Add a published application route
```

Contoh route:

```txt
Subdomain: <APP_SUBDOMAIN>
Domain: <YOUR_DOMAIN>
Path: kosongkan
Service Type: HTTP
Service URL: localhost:<APP_PORT>
```

Hasilnya:

```txt
https://<APP_SUBDOMAIN>.<YOUR_DOMAIN> → http://localhost:<APP_PORT>
```

Jangan gunakan hostname yang sama untuk SSH dan web app.

Contoh pemisahan yang benar:

```txt
<SSH_SUBDOMAIN>.<YOUR_DOMAIN>  → ssh://localhost:<SSH_PORT>
<APP_SUBDOMAIN>.<YOUR_DOMAIN>  → http://localhost:<APP_PORT>
```

---

## 11. Test dari Browser

Buka:

```txt
https://<APP_SUBDOMAIN>.<YOUR_DOMAIN>/login
```

Jika halaman login muncul, tunnel sudah benar.

Jika berhasil login dan masuk dashboard, deploy selesai.

---

## 12. Troubleshooting

### A. Domain muncul 502 Bad Gateway

Cek apakah app hidup:

```bash
pm2 status
curl -i http://localhost:<APP_PORT>
```

Kemungkinan penyebab:

```txt
PM2 app mati
Port salah
App tidak listen di port yang sesuai
Cloudflare Tunnel salah arah Service URL
```

---

### B. Login page muncul, tapi login gagal Server Error

Cek log:

```bash
pm2 logs <PM2_APP_NAME> --lines 100
```

Jika muncul:

```txt
HBError: Empty password
```

berarti `NUXT_SESSION_PASSWORD` belum masuk ke proses PM2.

Fix:

```bash
set -a
source .env
set +a
pm2 restart <PM2_APP_NAME> --update-env
```

---

### C. Database error

Cek apakah `DATABASE_URL` sudah masuk:

```bash
pm2 env <PM2_APP_ID> | grep DATABASE
```

Lalu jalankan:

```bash
npx prisma generate
npx prisma migrate deploy
pm2 restart <PM2_APP_NAME> --update-env
```

---

## 13. Quick Deploy Command

Gunakan ini sebagai command cepat saat deploy ulang:

```bash
cd <PROJECT_FOLDER>

cp .env.example .env
nano .env

npm install
npm run build

npx prisma generate
npx prisma migrate deploy

set -a
source .env
set +a

pm2 start .output/server/index.mjs --name <PM2_APP_NAME>
pm2 save

pm2 env <PM2_APP_ID> | grep -q NUXT_SESSION_PASSWORD && echo "OK: NUXT_SESSION_PASSWORD masuk" || echo "BELUM MASUK"

curl -i http://localhost:<APP_PORT>
curl -i http://localhost:<APP_PORT>/api/_auth/session
```

---

## Root Cause dari Issue Sebelumnya

Issue sebelumnya bukan berasal dari Cloudflare Tunnel, PM2 mati, atau Nuxt app tidak jalan.

Root cause-nya adalah:

```txt
File .env ada, tetapi isi .env belum masuk ke proses PM2 production.
```

Akibatnya, Nuxt auth/session tidak menemukan:

```env
NUXT_SESSION_PASSWORD
```

Lalu endpoint session error:

```txt
GET /api/_auth/session
HBError: Empty password
```

Solusi final:

```bash
set -a
source .env
set +a
pm2 restart <PM2_APP_NAME> --update-env
```

---

## Placeholder Reference

Ganti placeholder berikut sesuai environment masing-masing:

```txt
<PROJECT_FOLDER>     = lokasi folder project
<PROJECT_NAME>       = nama folder/project
<PM2_APP_NAME>       = nama app di PM2
<PM2_APP_ID>         = ID app di PM2
<APP_PORT>           = port lokal aplikasi
<DB_USER>            = username database
<DB_PASSWORD>        = password database
<DB_HOST>            = host database
<DB_PORT>            = port database
<DB_NAME>            = nama database
<YOUR_DOMAIN>        = domain yang dipakai
<APP_SUBDOMAIN>      = subdomain untuk web app
<SSH_SUBDOMAIN>      = subdomain untuk SSH
<SSH_PORT>           = port SSH
<ADMIN_EMAIL>        = email admin/demo user
<ADMIN_PASSWORD>     = password admin/demo user
```