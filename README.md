# AIKITA — Asisten Pengetahuan Frayas Academy

AIKITA adalah hasil konversi aplikasi Generative AI yang berjalan **murni lokal**: basis data lokal (SQLite), komponen lokal (mesin OCR/PDF, UI, ekspor), autentikasi lokal, dan **LLM lokal** (opsional, mis. Ollama). Tidak ada layanan cloud, tidak ada ketergantungan pada dispatcher ChatGPT, dan tidak ada plugin Cloudflare (Workers/D1/R2).

Organisasi pemakai: **Frayas Academy**

## Ringkasan konversi

| Aspek | AI Lain (service) | AIKITA (lokal) |
| --- | --- | --- |
| Basis data | Cloudflare D1 (binding `DB`) | SQLite lokal `data/aikita.db` via `node:sqlite` (`db/index.ts`) |
| Berkas versi dokumen | Bucket R2 (binding `BUCKET`) | Berkas lokal `data/blobs/<user>/<doc>/<v>.txt` (`lib/local-bucket.ts`) |
| Runtime | Cloudflare Workers (`@cloudflare/vite-plugin`, wrangler) | Node.js (`vinext dev` / `vinext build` + `vinext start`) |
| Autentikasi | Header dispatcher ChatGPT | Login lokal multi-akun + cookie HttpOnly bertanda HMAC (`app/local-auth.ts`, `lib/accounts.ts`, `/login`, `/api/auth`) |
| LLM | Tidak ada (kutipan kata kunci saja) | Konfigurasi Ollama/LLM lewat menu **Pengaturan AI** (uji koneksi, pilih model) + fallback kutipan |
| Ekstraksi dokumen | PDF.js + Tesseract.js dari `/public/engines` | Pilihan mode baca global: **OCR** (Tesseract) atau **LangChain** (`app/langchain-engine.ts`) |
| Nama & identitas | Dirgantara / Mabes AU / TNI AU | AIKITA / Frayas Academy |
| Peran demo | Admin / Personel | Admin / Anggota |

## Menjalankan

Prasyarat: Node.js >= 22.13 dan pnpm.

```bash
cd AIKITA
pnpm install        # atau: npm install
pnpm dev            # pengembangan, http://127.0.0.1:3000
pnpm build          # build produksi
pnpm start          # server produksi (Node.js)
```

Login bawaan: `admin` / `admin` (ubah lewat `.env.local`, lihat `Dokumentasi-Kustomisasi-AIKITA.docx`).

Selain akun bawaan, **admin dapat mendaftarkan akun pengguna** (nama pengguna +
kata sandi) lewat menu **Kelola pengguna**; pengguna langsung masuk di
`/login` dengan akun tersebut. Kata sandi disimpan ter-hash scrypt di SQLite.

## Kustomisasi lewat aplikasi (menu admin)

1. **Pengaturan AI** — koneksi Ollama/LLM lokal: URL, model, API key, batas
   waktu, tombol **Uji koneksi** (memuat daftar model dari server), dan sakelar
   aktif/nonaktif. Tersimpan di tabel `settings`, menimpa nilai `.env.local`.
2. **Kelola pengguna** — daftarkan akun (username + password + peran
   Admin/Anggota), aktifkan/nonaktifkan, atur ulang sandi, dan hapus akun.
3. **Mode baca dokumen** (di Pengaturan AI) — `OCR` (Tesseract, untuk PDF
   pindai) atau `LangChain` (pemuat → pemecah potongan → penelusur → rantai
   QA, tanpa OCR). Berlaku untuk penyiapan referensi, unggah pustaka, dan
   Studio; penelusuran jawaban ikut memakai mode yang sama.
4. **Pustaka dokumen** — tombol **Hapus** pada tabel pustaka menghapus dokumen
   beserta berkasnya di `data/blobs/`, sehingga kapasitas memori/bebas kembali.

## Konfigurasi lokal (.env.local)

```bash
AIKITA_USER=admin
AIKITA_PASS=admin
AIKITA_SESSION_SECRET=<rahasia-acak-panjang>
# AIKITA_DATA_DIR=./data
# AIKITA_LLM_ENABLED=true
# AIKITA_LLM_URL=http://127.0.0.1:11434
# AIKITA_LLM_MODEL=llama3.2
# AIKITA_LLM_API_KEY=
# AIKITA_LLM_TIMEOUT_MS=20000
# AIKITA_INGESTION_MODE=ocr   # atau langchain
```

Nilai `.env.local` hanya bawaan; admin dapat mengubahnya lewat **Pengaturan AI**.
Jika LLM lokal tidak berjalan, AIKITA tetap berfungsi: jawaban jatuh ke kutipan
kata kunci dari dokumen aktif.

## Struktur

- `app/workspace.tsx` — UI utama (sidebar, asisten, pustaka, studio, dashboard).
- `app/api/workspace/route.ts` — seluruh logika bisnis (dokumen bersama, akun,
  pengaturan AI, chat, audit).
- `app/api/auth/route.ts` — login/logout lokal.
- `app/data.ts` — 8 dokumen contoh Frayas Academy + state awal.
- `app/retrieval.ts` — penelusuran potongan tiga kalimat + penyaringan peran.
- `app/langchain-engine.ts` — pipeline LangChain (splitter, potongan per
  halaman, retriever) tanpa dependensi tambahan.
- `lib/local-llm.ts` — klien LLM lokal (resolve pengaturan, uji koneksi,
  daftar model); `lib/local-bucket.ts` — penyimpanan & penghapusan objek lokal.
- `lib/accounts.ts` — akun login (hash scrypt); `lib/settings.ts` —
  pengaturan global (Ollama & mode baca).
- `db/index.ts` — SQLite lokal; `db/schema.ts` + `drizzle/` — skema/migrasi.
- `public/engines/` — mesin PDF.js & Tesseract.js (OCR Indonesia + Inggris) disajikan lokal.
- `docs/Dokumentasi-Kustomisasi-AIKITA.docx` — dokumentasi kustomisasi lengkap.

## Verifikasi

- `pnpm typecheck` — pemeriksaan TypeScript.
- `pnpm build` — build produksi.
- Alur diuji lewat HTTP: login, GET/POST `/api/workspace`, aktivasi referensi, percakapan dengan dan tanpa LLM lokal.

