# Gomer Lapudo'oh — website musik dinamis

Website artis yang **otomatis memperbarui diri** saat Anda merilis lagu di Spotify (dan video di YouTube), tanpa mengedit source code.

> **Pembaruan sumber data.** Sumber musik utama sekarang **Apple Music** lewat iTunes Lookup API (gratis, **tanpa kunci, tanpa akun developer, tanpa Spotify Premium**). Video YouTube memakai **feed RSS publik** (tanpa API key). Spotify tetap tersedia sebagai opsi (`MUSIC_SOURCE=spotify`). Bagian di bawah yang menyebut Spotify sebagai sumber utama kini berlaku hanya untuk opsi tersebut.

> **Versi terbaru: meniru desain website lama (bahasa Inggris) + panel admin.** Struktur halaman mengikuti website Hostinger Website Builder yang lama: hero layar penuh (foto latar, judul "GOMER LAPUDOOH" bergaya cap merah, paragraf pengantar), menu Music / Gallery / About, bagian terang "New album is out now" (biodata + sampul membulat; judul menyesuaikan jenis rilisan terbaru), "Other releases", bagian event (foto latar + video), footer gelap dengan ikon streaming, halaman Gallery berbagian, dan tombol WhatsApp melayang. Rilisan musik otomatis dari Apple Music.
> **Panel admin (`/admin`, bahasa Indonesia, login berbasis cookie sesi):** edit teks pengantar, biodata, bagian event, WhatsApp, email, dan semua link streaming/sosial; unggah foto (dikecilkan otomatis di browser, disimpan di database) dan tetapkan sebagai Logo / foto latar halaman depan / foto latar Gallery / latar Event; kelola bagian Gallery (judul, keterangan, tata letak baris/kolom, urutan); tambah/sembunyikan video YouTube.
> **Teks awal** (pengantar, 3 paragraf biodata, detail event) disalin dari screenshot website lama ke `src/config/content-defaults.ts`; dipakai selama belum ada isi tersimpan di admin — mohon periksa ejaannya. **Gambar (logo, foto hero, foto Gallery, latar event) harus Anda unggah dari file aslinya di admin** — gambar tidak bisa diambil dari screenshot. Alamat Gallery lama (`/gallery-of-gomer-lapudooh-music-journey`) otomatis dialihkan ke `/gallery`.
> Tabel baru: `settings`, `media`, `gallery_sections`, serta kolom `source` & `hidden` pada `videos` (lihat `database/schema.sql`; jika sudah terlanjur mengimpor versi lama, impor `database/add-admin-tables.sql`).
> Fitur admin membutuhkan `DATABASE_URL`, `ADMIN_USER`, `ADMIN_PASSWORD` (≥ 12 karakter), dan `CRON_SECRET` (≥ 24 karakter; ikut dipakai sebagai bagian kunci sesi). Mengganti salah satu password otomatis mengeluarkan semua sesi login.

```
Rilis di Apple Music (atau Spotify) → Cron terjadwal → /api/sync/music → MySQL (upsert) → Website (ISR) → "Latest Release" berubah
Upload di YouTube → Cron terjadwal → /api/sync/social → MySQL (upsert) → Website menampilkan video terbaru
```

Stack: Next.js (App Router) · TypeScript · Tailwind CSS v4 · **MySQL/MariaDB** · Drizzle ORM · Vercel (hosting + cron).

> **Catatan penting.** Website lama tidak bisa saya akses (situsnya memblokir akses otomatis) dan saya tidak punya repository-nya, jadi ini **dibangun ulang dari nol**. Desain dan branding lama tidak ikut terbawa; tampilan baru dibuat dari awal dan mudah disesuaikan (lihat "Menyesuaikan tampilan"). Deploy dulu ke URL preview Vercel dan jangan arahkan domain sebelum Anda puas dengan hasilnya.

---

## 1. Daftar file yang dibuat

Semua file baru (tidak ada file lama yang diubah).

| Area | File |
|---|---|
| Konfigurasi | `package.json`, `tsconfig.json`, `next.config.ts` (security headers + CSP), `postcss.config.mjs`, `drizzle.config.ts`, `vercel.json` (cron), `vitest.config.ts`, `.gitignore`, `.env.example` |
| Konfigurasi situs | `src/config/site.ts` (nama, Spotify artist ID, link sosial), `src/config/release-overrides.ts` (deskripsi & link platform lain per rilisan) |
| Integrasi (modular) | `src/integrations/types.ts` (kontrak), `registry.ts`, `streaming.ts`, `spotify/{auth,client,schemas,mapper,errors,index}.ts`, `youtube/index.ts`, kerangka `instagram/`, `tiktok/`, `facebook/` |
| Layanan | `src/services/sync.ts` (sync + status), `releases.ts` (baca + fallback), `videos.ts` |
| Database | `src/lib/db/schema.ts` (releases, tracks, videos, sync_runs), `src/lib/db/index.ts` |
| Keamanan/util | `src/lib/{env,logger,security,rate-limit,http,slug,format,api}.ts`, `src/middleware.ts` (Basic Auth admin) |
| API | `src/app/api/releases/route.ts`, `.../latest/route.ts`, `.../[id]/route.ts`, `api/sync/music/route.ts`, `api/sync/social/route.ts`, `api/admin/status/route.ts` |
| Halaman | `src/app/{layout,page,not-found,sitemap,robots}`, `music/page.tsx`, `music/[slug]/page.tsx`, `admin/sync/page.tsx`, `globals.css` |
| Komponen | `src/components/*` (header, footer, artwork, release-card, connect-section, videos-section, lite-youtube, icons, json-ld, buttons) |
| Script | `scripts/spotify-authorize.mjs`, `scripts/sync-local.ts`, `scripts/audit-secrets.sh` |
| Tes | `src/**/*.test.ts` (slug, format, logger, spotify mapper, spotify client) |

## 2. Daftar file yang diubah

Tidak ada. Ini project baru. Jika Anda menaruhnya di repository lama, pindahkan isi lama ke branch/folder cadangan lebih dulu.

## 3. Environment variables

| Variabel | Jenis | Wajib? | Keterangan |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **PUBLIC** | Disarankan | URL situs (canonical, sitemap, Open Graph). Satu-satunya variabel yang boleh terlihat browser. |
| `DATABASE_URL` | SECRET | Untuk sinkronisasi | `mysql://USER:PASSWORD@HOST:3306/NAMA_DB` |
| `DATABASE_SSL` | Server | Tidak | Kosong = TLS aktif. `false` untuk koneksi lokal (`127.0.0.1`) |
| `CRON_SECRET` | SECRET | Untuk sinkronisasi | ≥ 24 karakter acak; melindungi `/api/sync/*` |
| `ADMIN_USER`, `ADMIN_PASSWORD` | SECRET | Untuk admin | Password ≥ 12 karakter. Tanpa keduanya, `/admin` **tertutup** (503) |
| `MUSIC_SOURCE` | Server | Tidak | Kosong/`apple` = Apple Music; `spotify` = Spotify |
| `YOUTUBE_CHANNEL_ID` | Server | Tidak | Menimpa ID kanal default di `src/config/site.ts` |
| `ENABLE_STALE_SYNC` | Server | Tidak | `true` = fallback refresh berbasis TTL tanpa cron |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` | SECRET | Hanya jika `MUSIC_SOURCE=spotify` | Server only |

Tidak ada secret yang diberi awalan `NEXT_PUBLIC_`. Semua secret dibaca lewat `src/lib/env.ts` yang memakai `server-only`, sehingga build gagal jika ada komponen browser yang mengimpornya.

## 4. Sumber data & credential

**Apple Music (default, tanpa kunci).** ID artis ada di `src/config/site.ts` (`appleMusicArtistId`, angka di akhir URL halaman artis Apple Music). Data: judul, sampul, tanggal rilis, jumlah lagu, tracklist, durasi. Apple menandai EP/Single lewat akhiran judul ("- EP", "- Single"); koreksi manual lewat `type` di `release-overrides.ts`. Storefront bisa diganti lewat `appleMusicCountry`.

**YouTube (tanpa kunci).** Feed RSS `https://www.youtube.com/feeds/videos.xml?channel_id=...`. ID kanal default ada di `site.ts` (`youtubeChannelId`); kosongkan untuk menonaktifkan video.

**Spotify (opsional).** Hanya jika `MUSIC_SOURCE=spotify`: buat app di <https://developer.spotify.com/dashboard> (Web API, Redirect URI `http://127.0.0.1:8888/callback`), salin Client ID/secret. Sejak perubahan Spotify Februari 2026, app Development Mode mensyaratkan pemilik app memiliki **Premium aktif** (jika tidak, API mengembalikan 403). `SPOTIFY_REFRESH_TOKEN` opsional: jalankan `npm run spotify:authorize` bila Client Credentials ditolak.

> **Mengganti sumber musik:** website hanya menampilkan rilisan dari sumber aktif (kolom `platform`), jadi rilisan dari sumber lama tidak tampil ganda; jalankan sinkronisasi ulang setelah mengganti `MUSIC_SOURCE`.

**Database:** MySQL 8+ / MariaDB 10.5+ (lihat Lampiran Hostinger). **`CRON_SECRET`:** `node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"`. **`ADMIN_PASSWORD`:** password manager, ≥ 12 karakter.

## 5. Cara memasukkan credential secara aman

- **Lokal:** `cp .env.example .env.local`, isi nilainya. `.env.local` sudah ada di `.gitignore`.
- **Production (Vercel):** *Project → Settings → Environment Variables*. Tempel tiap variabel (Production, dan Preview bila perlu). Jangan taruh di source code, chat, atau screenshot.
- Jika pernah menempelkan secret di tempat yang tidak aman (chat, commit), **anggap bocor dan buat ulang** (Spotify: *Rotate client secret*).

## 6. Sinkronisasi awal

```bash
npm install
cp .env.example .env.local        # isi nilai
npm run db:push                   # membuat tabel di MySQL
npm run sync:music -- --force     # tarik semua rilisan dari Spotify
npm run sync:social -- --force    # (opsional) video YouTube
```

Atau setelah deploy: masuk `/admin/sync` (Basic Auth) lalu klik **Sinkronkan musik sekarang**, atau:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" "https://www.gomerlapudooh.com/api/sync/music?force=1"
```

Respons hanya berisi jumlah item (`{"ok":true,"found":12,"upserted":12}`); detail error tidak dikirim ke client.

## 7. Mengaktifkan sinkronisasi otomatis

`vercel.json` sudah mendaftarkan cron harian: musik 03:00 UTC (10:00 WIB), video 03:30 UTC. Vercel otomatis mengirim `Authorization: Bearer <CRON_SECRET>` bila variabel `CRON_SECRET` ada.

- Paket Hobby Vercel membatasi frekuensi cron (saat ini sekali sehari); jadwal default sengaja aman untuk semua paket. Jika memakai paket berbayar, ubah ke mis. `0 */6 * * *` — cek batas terbaru di dokumentasi Vercel.
- Setelah sync berhasil, cache halaman langsung diperbarui (`revalidatePath`). Tanpa itu, halaman tetap refresh otomatis tiap 1 jam (ISR).
- **Tanpa cron** (hosting lain): set `ENABLE_STALE_SYNC=true`. Saat halaman di-refresh dan data lebih tua dari 24 jam, sync dipicu di latar belakang, dibatasi cooldown 1 jam. Atau panggil endpoint sync dari scheduler eksternal (GitHub Actions, cron-job.org) dengan header Bearer.
- Pembatas beban: cooldown 10 menit antar-sync (`?force=1` melewatinya), tracklist hanya diambil untuk rilisan **baru**, konkurensi 3, dan maksimal 100 rilisan per sync.

## 8. Deploy ke production

1. `git init`, lalu **jalankan `npm run audit:secrets`** sebelum commit pertama. Push ke repository **private** di GitHub.
2. Vercel → *Add New Project* → impor repo. Framework terdeteksi Next.js.
3. Isi environment variables (bagian 3) → Deploy. Uji di URL `*.vercel.app`.
4. Jalankan `npm run db:push` **sekali** dari komputer Anda dengan `DATABASE_URL` yang sama (atau gunakan `db:generate` + `db:migrate` untuk perubahan skema selanjutnya).
5. Lakukan sinkronisasi awal (bagian 6), cek `/admin/sync`, `/`, `/music`.
6. *Settings → Domains* → tambahkan `www.gomerlapudooh.com` dan ikuti instruksi DNS. HTTPS otomatis; header HSTS sudah dipasang.

## 9. Security checklist

- [x] Tidak ada API key/secret/password di source code (`npm run audit:secrets` memindai polanya)
- [x] Secret hanya di env; `src/lib/env.ts` memakai `server-only`; tidak ada secret berawalan `NEXT_PUBLIC_`
- [x] `.env`, `.env.local`, `.env.production`, `.env.*.local` di `.gitignore`; `.env.example` tersedia dan kosong
- [x] Panggilan Spotify/YouTube hanya dari server; token Spotify di memori server, di-cache sampai hampir kedaluwarsa, refresh otomatis saat 401
- [x] Endpoint sync: Bearer `CRON_SECRET` (constant-time), rate limit, fail-closed jika secret belum diatur
- [x] `/admin` & `/api/admin`: Basic Auth via middleware, fail-closed (503) jika kredensial belum diatur, `noindex`
- [x] Respons API divalidasi (zod); host `next` Spotify dibatasi ke `api.spotify.com`; ID video YouTube divalidasi sebelum dipakai di embed
- [x] Timeout semua request eksternal; penanganan 429/Retry-After; retry terbatas
- [x] Error ke client generik; detail hanya di log & halaman admin. Logger meredaksi secret (berdasarkan nama key dan nilai env)
- [x] Header keamanan: CSP terbatas ke Spotify/YouTube, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`
- [x] JSON-LD di-escape; YouTube dimuat lewat `youtube-nocookie` dan baru setelah diklik
- [ ] **Anda:** batasi API key YouTube ke YouTube Data API v3; gunakan password admin kuat; repo GitHub private; rotasi secret bila pernah terekspos
- [ ] **Anda:** setelah build, jalankan `npm run audit:secrets` lagi (memeriksa `.next/static` tidak memuat nilai secret)

## 10. Hasil testing

**Sudah dijalankan di sini** (sandbox tanpa akses internet, sehingga `npm install` tidak bisa dijalankan):

| Pengujian | Hasil |
|---|---|
| Pemeriksaan sintaks seluruh 63 file TS/TSX | 0 error |
| Tes logika murni (slugify, uniqueSlug, format tanggal/durasi, klasifikasi tipe rilisan, normalisasi tanggal, pemilihan artwork, dedupe track, mapper) | Lulus |
| `audit:secrets` pada source code (tanpa pola credential, `.gitignore` benar, tidak ada `NEXT_PUBLIC_` bersecret) | Lulus |

**Belum bisa saya jalankan — mohon dijalankan di komputer Anda:**

| # | Uji (dari daftar Anda) | Cara | Hasil yang diharapkan |
|---|---|---|---|
| 1 | Situs terbuka tanpa credential | `npm run build && npm start` tanpa `.env.local` | Halaman `/` menampilkan empty state + tombol profil Spotify; tidak crash |
| 2 | Spotify bekerja dengan `.env` valid | `npm run sync:music -- --force` | Log "sync completed", `/` menampilkan rilisan terbaru |
| 3 | Credential invalid → gagal rapi | Isi secret salah, jalankan sync | Pesan "Autentikasi Spotify ditolak", situs tetap tampil, error tercatat di `/admin/sync` |
| 4 | Secret tidak di bundle frontend | `npm run build && npm run audit:secrets` | "bundle frontend bersih" |
| 5 | Secret tidak di respons API | `curl /api/releases` dan cari nilai secret | Tidak ada |
| 6 | Tidak ada duplikat | Jalankan sync 2× dengan `--force`; `select count(*) from releases` | Jumlah sama (unique `platform+external_id`, upsert) |
| 7 | Token kedaluwarsa | `npm test` (`client.test.ts`: 401 → token diminta ulang) | Lulus |
| 8 | Rate limit | `npm test` (`client.test.ts`: 429 pendek → retry; panjang → `SpotifyRateLimitError`) | Lulus |
| 9 | Cache saat Spotify gagal | Sync sukses sekali, lalu isi secret salah dan muat ulang | Situs tetap menampilkan data dari database |
| 10 | Layout mobile | DevTools lebar 375 px | Baris rilisan geser horizontal, tanpa scroll samping |
| 11 | Build production | `npm run build` | Sukses |

Selain itu jalankan `npm run typecheck` dan `npm test`. Karena tidak bisa dieksekusi di sini, ada kemungkinan kecil error tipe atau versi dependensi yang baru terlihat saat `npm install` / `npm run build`; kirim pesan error-nya ke saya jika ada.

## 11. Arsitektur final

```
                    ┌────────────────────────── server only ──────────────────────────┐
Spotify Web API ──► │ integrations/spotify (auth · client · schemas · mapper)         │
YouTube Data API ─► │ integrations/youtube                                            │
(IG/TikTok/FB: kerangka)                     │                                        │
                    │              integrations/registry.ts  (daftar provider)        │
                    │                          │                                      │
Vercel Cron ──GET──►│ /api/sync/music|social ──► services/sync.ts ──upsert──► MySQL │
 (Bearer secret)    └──────────────────────────────────────────────────┬──────────────┘
                                                                        │
Browser ◄── halaman ISR (revalidate 1 jam + on-demand) ◄── services/releases.ts
                                   │      urutan sumber: MySQL → Spotify live (cache TTL 6 jam) → data statis
                                   └── /api/releases · /latest · /[id]  (read-only, di-cache CDN)
Admin  ── Basic Auth ──► /admin/sync  (status, error terakhir, tombol sync manual)
```

Model data: `releases` (unik `platform+external_id`, `slug` unik & stabil), `tracks` (unik `release_id+external_id`), `videos`, `sync_runs`. Tidak ada kolom credential.

**Menambah platform baru** (Apple Music, Deezer, Bandcamp, …): buat folder `src/integrations/<nama>` yang mengekspor `MusicProvider` dan daftarkan di `registry.ts`. Kolom `platform` sudah ada di database, jadi tidak perlu rewrite. Untuk tautan platform lain pada rilisan Spotify yang ada, isi `links` di `src/config/release-overrides.ts`.

### Menyesuaikan tampilan
- Warna: token di `src/app/globals.css` (`@theme`). Font: `src/app/layout.tsx`. Nama & link sosial: `src/config/site.ts` (link kosong otomatis disembunyikan).
- Sorotan desain: cahaya latar hero diambil dari **artwork rilisan terbaru**, sehingga suasana halaman berubah sendiri setiap ada rilisan baru; elemen lain sengaja tenang.

### Batasan yang perlu Anda ketahui
- Spotify **tidak menyediakan deskripsi rilisan, label, maupun tautan platform lain**; bagian itu hanya tampil jika Anda mengisinya di `release-overrides.ts`. Website tidak mengarang data. Genre dari Spotify sering kosong untuk artis kecil.
- Spotify menandai EP sebagai "single"; website mengklasifikasi single ≥ 4 lagu sebagai EP. Koreksi manual lewat `type` di `release-overrides.ts`.
- Instagram, TikTok, dan Facebook baru berupa kerangka; masing-masing membutuhkan approval app di platformnya.
- Rate limiter bersifat in-memory per instance serverless (perlindungan best-effort); garis pertahanan utama adalah cache CDN, cooldown sync, dan secret pada endpoint sync.

---

## Lampiran: Deploy di Hostinger Business Web Hosting (Node.js + MySQL lokal)

Paket Business mendukung aplikasi Node.js lewat hPanel; Next.js dijalankan dalam mode server (standalone), ISR dan on-demand revalidation berfungsi. Karena aplikasi dan MySQL ada di akun yang sama, koneksi bersifat lokal dan **Remote MySQL tidak perlu diaktifkan**.

1. Buat database + user di hPanel → Databases → Management. Jalankan `database/schema.sql` (versi terbaru, sudah termasuk tabel admin) lewat phpMyAdmin (tab Import).
2. Isi environment variables di dashboard aplikasi Node.js (bukan Vercel). Untuk database: `DATABASE_URL=mysql://USER:PASSWORD@127.0.0.1:3306/NAMA_DB` dan `DATABASE_SSL=false`. Gunakan `127.0.0.1`, bukan `localhost`.
3. Set `NEXT_PUBLIC_SITE_URL` **sebelum** build pertama.
4. Sinkronisasi terjadwal: hPanel → Cron Jobs, perintah `curl -fsS -X POST -H "Authorization: Bearer CRON_SECRET_ANDA" https://www.gomerlapudooh.com/api/sync/music >> $HOME/sync.log 2>&1` (`vercel.json` diabaikan di Hostinger).
