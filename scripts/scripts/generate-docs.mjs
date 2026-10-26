// Generator dokumentasi kustomisasi AIKITA (DOCX).
// Jalankan: node scripts/generate-docs.mjs  -> docs/Dokumentasi-Kustomisasi-AIKITA.docx
import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

const OUT = path.join(process.cwd(), "docs", "Dokumentasi-Kustomisasi-AIKITA.docx");

// ---------- helper ----------
const title = (t) =>
  new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: t, bold: true })] });
const subtitle = (t) =>
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: t, color: "666666", size: 20 })] });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 }, children: [new TextRun({ text: t, bold: true, color: "1F3864" })] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 100 }, children: [new TextRun({ text: t, bold: true, color: "2E5A88" })] });
const p = (t) => new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: t })] });
const pBold = (t) => new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: t, bold: true })] });
const bullet = (t) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: t })] });
const code = (block) =>
  String(block)
    .replace(/^\n+|\n+$/g, "")
    .split("\n")
    .map(
      (line) =>
        new Paragraph({
          shading: { fill: "F3F5F8" },
          spacing: { after: 0 },
          children: [new TextRun({ text: line || " ", font: "Consolas", size: 18 })],
        }),
    );
const spacer = () => new Paragraph({ text: "", spacing: { after: 120 } });

const cell = (text, opts = {}) =>
  new TableCell({
    shading: opts.header ? { fill: "1F3864" } : opts.alt ? { fill: "F7F9FC" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(text), bold: !!opts.header, color: opts.header ? "FFFFFF" : "222222", size: 18, font: opts.mono ? "Consolas" : undefined })],
      }),
    ],
  });

const table = (headers, rows, widths) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "C9D2DC" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "C9D2DC" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "C9D2DC" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "C9D2DC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "C9D2DC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "C9D2DC" },
    },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true })) }),
      ...rows.map((r, ri) => new TableRow({ children: r.map((c, i) => cell(c, { alt: ri % 2 === 1, mono: i === 0 })) })),
    ],
  });

// ---------- konten ----------
const children = [];

children.push(
  title("Dokumentasi Kustomisasi AIKITA"),
  subtitle("Asisten Pengetahuan Frayas Academy — konversi lokal dari Dirgantara"),
  subtitle("Versi 1.0 · Dokumen dihasilkan otomatis oleh scripts/generate-docs.mjs (pnpm docs)"),
);

// 1
children.push(
  h1("1. Pendahuluan"),
  h2("1.1 Apa itu AIKITA"),
  p("AIKITA adalah aplikasi asisten pengetahuan internal: pengguna mengunggah dokumen, sistem menelusuri potongan dokumen, menampilkan jawaban beserta kutipan sumber, dan menyediakan Studio Dokumen (ringkasan, infografis, slide, flashcard) yang semuanya berjalan di perangkat sendiri."),
  p("Aplikasi ini merupakan hasil konversi dari prototipe bernama Dirgantara agar berjalan murni lokal: basis data lokal, komponen lokal, autentikasi lokal, dan LLM lokal. Identitas aplikasi diubah menjadi AIKITA dan seluruh konteks organisasi disesuaikan untuk Frayas Academy (menggantikan konteks TNI AU pada versi asli: Mabes AU, Angkatan Udara, peran Personel menjadi Anggota)."),
  h2("1.2 Prinsip murni lokal"),
  bullet("Tidak ada layanan cloud: tanpa Cloudflare Workers, D1, R2, maupun layanan AI eksternal."),
  bullet("Tidak ada panggilan jaringan keluar selama penggunaan normal; mesin PDF.js dan OCR (Tesseract.js) disajikan dari folder public/engines pada origin yang sama."),
  bullet("Basis data berupa file SQLite di dalam folder proyek; versi dokumen berupa berkas teks lokal."),
  bullet("LLM lokal bersifat opsional: aplikasi tetap berfungsi penuh tanpa LLM (jawaban berupa kutipan kata kunci)."),
  bullet("Autentikasi memakai akun lokal dan cookie HttpOnly bertanda HMAC, tanpa dispatcher ChatGPT."),
);

// 2
children.push(
  h1("2. Ringkasan Konversi"),
  table(
    ["Aspek", "Dirgantara (asli)", "AIKITA (lokal)"],
    [
      ["Basis data", "Cloudflare D1 (binding DB)", "SQLite lokal data/aikita.db lewat node:sqlite (db/index.ts)"],
      ["Berkas versi", "Bucket R2 (binding BUCKET)", "Berkas lokal data/blobs/<user>/<doc>/<v>.txt (lib/local-bucket.ts)"],
      ["Runtime server", "Cloudflare Workers + wrangler", "Node.js: vinext dev / vinext build + vinext start"],
      ["Build tooling", "vite + @cloudflare/vite-plugin + plugin sites", "vite + vinext saja (vite.config.ts)"],
      ["Autentikasi", "Header oai-authenticated-user-* dari dispatcher ChatGPT", "Login lokal /login + POST /api/auth, cookie aikita_session (HMAC-SHA256)"],
      ["LLM", "Tidak ada; jawaban kutipan kata kunci", "LLM lokal OpenAI-compatible (lib/local-llm.ts) + fallback kutipan"],
      ["Ekstraksi dokumen", "PDF.js + Tesseract.js dari /public/engines", "Sama (sudah lokal, tidak diubah)"],
      ["Nama & identitas", "Dirgantara · Mabes AU · TNI AU", "AIKITA · Frayas Academy"],
      ["Peran demo", "Admin / Personel", "Admin / Anggota"],
      ["Berkas dihapus", "app/chatgpt-auth.ts, plugin cloudflare, .openai/hosting.json", "Diganti app/local-auth.ts, app/api/auth/route.ts, app/login/page.tsx"],
    ],
  ),
  spacer(),
  p("Berkas sumber yang ditambahkan: app/local-auth.ts, app/login/page.tsx, app/api/auth/route.ts, lib/local-llm.ts, lib/local-bucket.ts, .env.example, README.md, dan dokumen ini."),
);

// 3
children.push(
  h1("3. Struktur Folder AIKITA"),
  code(`AIKITA/
├── app/
│   ├── layout.tsx              # metadata judul & deskripsi AIKITA
│   ├── page.tsx                # gerbang: redirect ke /login bila belum masuk
│   ├── login/page.tsx          # halaman masuk lokal
│   ├── local-auth.ts           # sesi cookie HMAC + verifikasi kredensial
│   ├── workspace.tsx           # UI utama (sidebar, asisten, pustaka, dashboard)
│   ├── knowledge-setup.tsx     # penyiapan folder referensi + review OCR
│   ├── document-studio.tsx     # Studio Dokumen (ringkasan/infografis/slide/flashcard)
│   ├── document-engine.ts      # ekstraksi TXT/DOCX/PDF + OCR lokal
│   ├── study-engine.ts         # poin belajar & flashcard
│   ├── retrieval.ts            # penelusuran potongan & penyaringan peran
│   ├── data.ts                 # 8 dokumen contoh + state awal
│   ├── globals.css             # gaya aplikasi (Tailwind 4 + tema)
│   └── api/
│       ├── auth/route.ts       # POST /api/auth (masuk/keluar)
│       └── workspace/route.ts  # GET/POST /api/workspace (seluruh logika bisnis)
├── lib/
│   ├── local-llm.ts            # klien LLM lokal + prompt berbasis kutipan
│   ├── local-bucket.ts         # penyimpanan objek lokal (pengganti R2)
│   └── utils.ts                # utilitas cn() untuk kelas Tailwind
├── db/
│   ├── index.ts                # koneksi SQLite lokal + shim ala D1
│   └── schema.ts               # skema drizzle (workspaces)
├── components/ui/              # komponen shadcn/ui (lokal, tanpa CDN)
├── public/engines/             # pdf.js, tesseract.js, cmaps, traineddata (lokal)
├── data/                       # DIBUAT OTOMATIS: aikita.db + blobs/ (abaikan di git)
├── docs/                       # dokumentasi ini
├── scripts/generate-docs.mjs   # generator dokumentasi DOCX
├── vite.config.ts              # tanpa plugin Cloudflare
├── package.json                # skrip dev/build/start/typecheck/docs
└── .env.example                # templat variabel lingkungan lokal`),
  spacer(),
);

// 4
children.push(
  h1("4. Persyaratan Sistem dan Menjalankan Aplikasi"),
  pBold("Persyaratan"),
  bullet("Node.js >= 22.13 (fitur node:sqlite dipakai untuk basis data lokal)."),
  bullet("pnpm (atau npm/yarn) untuk menjalankan skrip."),
  bullet("Browser modern dengan dukungan WebAssembly & Web Worker (untuk OCR)."),
  bullet("Opsional: runtime LLM lokal seperti Ollama, LM Studio, atau llama.cpp server."),
  spacer(),
  pBold("Perintah"),
  code(`cd AIKITA
pnpm install        # instal dependensi (sekali saja)
pnpm dev            # mode pengembangan  -> http://127.0.0.1:3000
pnpm build          # build produksi
pnpm start          # server produksi    -> http://127.0.0.1:3000
pnpm typecheck      # pemeriksaan TypeScript
pnpm lint           # ESLint
pnpm docs           # regenerasi dokumentasi DOCX ini`),
  spacer(),
  p("Login bawaan: admin / admin. Ubah melalui .env.local (bagian 5) sebelum dipakai bersama."),
);

// 5
children.push(
  h1("5. Konfigurasi (.env.local)"),
  p("Salin .env.example menjadi .env.local di folder AIKITA. Vinext memuat file .env saat dev dan start."),
  table(
    ["Variabel", "Default", "Keterangan"],
    [
      ["AIKITA_USER", "admin", "Nama pengguna login lokal."],
      ["AIKITA_PASS", "admin", "Kata sandi login lokal."],
      ["AIKITA_SESSION_SECRET", "ganti-dengan-...", "Kunci HMAC cookie sesi. WAJIB diganti pada pemakaian nyata."],
      ["AIKITA_DATA_DIR", "./data", "Folder database dan blobs."],
      ["AIKITA_LLM_URL", "http://127.0.0.1:11434/v1/chat/completions", "Endpoint LLM lokal OpenAI-compatible."],
      ["AIKITA_LLM_MODEL", "llama3.2", "Nama model yang dikirim ke endpoint."],
      ["AIKITA_LLM_API_KEY", "(kosong)", "Opsional, untuk server yang meminta Bearer token."],
      ["AIKITA_LLM_TIMEOUT_MS", "20000", "Batas waktu tunggu jawaban LLM sebelum fallback."],
    ],
  ),
  spacer(),
  code(`# contoh .env.local
AIKITA_USER=admin
AIKITA_PASS=GantiSandiKuat123
AIKITA_SESSION_SECRET=b1f0c9e2a7d84f6c9a3e5b1d7f2c8a04...   # openssl rand -hex 32
AIKITA_LLM_MODEL=qwen2.5:7b`),
);

// 6
children.push(
  h1("6. Basis Data dan Penyimpanan Lokal"),
  h2("6.1 Database SQLite"),
  bullet("File: data/aikita.db (dibuat otomatis saat permintaan pertama, skema tabel workspaces)."),
  bullet("Lapisan db/index.ts meniru API D1 (prepare/bind/first/run) sehingga logika rute tidak berubah."),
  bullet("Isi: satu baris per ruang kerja, kolom data berisi JSON berisi dokumen, pengguna, percakapan, log, dan penyiapan referensi."),
  spacer(),
  pBold("Backup"),
  code(`cp data/aikita.db backup/aikita-$(date +%F).db`),
  pBold("Reset (hapus semua data contoh dan unggahan)"),
  code(`# matikan server lebih dulu
rm -rf data/          # database dan seluruh versi dokumen ikut terhapus`),
  h2("6.2 Penyimpanan versi dokumen"),
  p("Setiap unggahan menulis salinan isi ke data/blobs/<userId>/<docId>/<versi>.txt lewat lib/local-bucket.ts (pengganti R2). Retrieval tetap memakai teks yang tersimpan di dalam JSON dokumen, sehingga blobs berperan sebagai arsip versi."),
  h2("6.3 Batas kapasitas (warisan desain asli)"),
  bullet("Pertanyaan maksimal 4.000 karakter; dokumen maksimal 300.000 karakter; judul maksimal 160 karakter."),
  bullet("Unggahan berkas maksimal 15 MB; PDF maksimal 50 halaman; maksimal 20 berkas per proses penyiapan."),
  bullet("Ruang kerja dibatasi sekitar 1,8 MB JSON; riwayat 40 percakapan × 20 giliran; log 100 entri; dokumen Studio maksimal 12."),
);

// 7
children.push(
  h1("7. Autentikasi Lokal"),
  bullet("POST /api/auth dengan {username, password} menghasilkan cookie aikita_session (HttpOnly, SameSite=Lax, berlaku 7 hari, ditandatangani HMAC-SHA256)."),
  bullet("POST /api/auth dengan {action:'logout'} menghapus cookie (dipakai tombol Keluar pada dialog akun)."),
  bullet("app/page.tsx me-redirect ke /login bila cookie tidak ada; API mengembalikan 401 bila sesi tidak valid."),
  bullet("Kredensial dibaca dari AIKITA_USER/AIKITA_PASS — ubah di .env.local; sesi ditandatangani AIKITA_SESSION_SECRET."),
  spacer(),
  p("Peran Admin/Anggota di dalam aplikasi adalah simulasi milik pemilik ruang kerja (bukan sistem otorisasi multi-unit). Server tetap menolak aksi admin saat mode Anggota dan menyaring dokumen, pengguna, log, serta riwayat sebelum dikirim ke browser."),
  p("Untuk produksi: ganti mekanisme akun lokal dengan SSO/IdP organisasi, pertahankan penegakan otorisasi di server seperti sekarang."),
);

// 8
children.push(
  h1("8. LLM Lokal"),
  h2("8.1 Menjalankan model"),
  code(`# Ollama (default: http://127.0.0.1:11434)
ollama pull llama3.2
ollama serve

# uji cepat
curl -s http://127.0.0.1:11434/v1/chat/completions \\
  -H 'Content-Type: application/json' \\
  -d '{"model":"llama3.2","messages":[{"role":"user","content":"halo"}]}'`),
  h2("8.2 Alternatif endpoint"),
  table(
    ["Runtime", "AIKITA_LLM_URL"],
    [
      ["Ollama", "http://127.0.0.1:11434/v1/chat/completions"],
      ["LM Studio", "http://127.0.0.1:1234/v1/chat/completions"],
      ["llama.cpp server", "http://127.0.0.1:8080/v1/chat/completions"],
      ["vLLM / server lokal lain", "http://127.0.0.1:8000/v1/chat/completions"],
    ],
  ),
  spacer(),
  h2("8.3 Perilaku aplikasi"),
  bullet("Pertanyaan diambil relevansinya lewat retrieval (maksimal 4 potongan), lalu dikirim ke LLM lokal bersama kutipan tersebut sebagai konteks."),
  bullet("Prompt (lib/local-llm.ts) mewajibkan jawaban hanya dari kutipan, memakai penanda sumber [1], [2], dan menyatakan 'informasi belum ditemukan' bila tidak ada bukti."),
  bullet("Jika LLM tidak merespons dalam AIKITA_LLM_TIMEOUT_MS atau terjadi galat, aplikasi otomatis memakai kutipan kata kunci — tidak ada error yang ditampilkan ke pengguna."),
  bullet("Label jawaban di UI menunjukkan 'LLM lokal · <model>' bila LLM dipakai, atau 'Kutipan sumber · lokal' bila fallback."),
  h2("8.4 Mengganti/menambah model"),
  code(`# cukup ubah .env.local lalu restart server
AIKITA_LLM_MODEL=qwen2.5:7b
# atau ganti endpoint sepenuhnya
AIKITA_LLM_URL=http://127.0.0.1:1234/v1/chat/completions`),
  p("Untuk kualitas jawaban yang lebih baik, pilih model berbahasa Indonesia (mis. qwen2.5, gemma, atau llama3.2 yang telah dialihbahasakan) dan sesuaikan SYSTEM_PROMPT di lib/local-llm.ts."),
);

// 9
children.push(
  h1("9. Kustomisasi Identitas dan Branding"),
  p("Semua nama Dirgantara, Mabes AU, TNI AU, dan Angkatan Udara telah diganti. Bila ingin mengganti nama organisasi atau logo, ubah baris berikut:"),
  table(
    ["File", "Yang dicari", "Keterangan"],
    [
      ["app/layout.tsx", "title & description", "Judul tab dan deskripsi halaman."],
      ["app/login/page.tsx", "brandmark 'A', 'Masuk ke AIKITA', 'Frayas Academy'", "Layar masuk."],
      ["app/workspace.tsx", "brandmark 'A', 'aikita', brand-sub 'FRAYAS ACADEMY'", "Logo pada sidebar."],
      ["app/workspace.tsx", "Frayas Academy · Lokal", "Label kanan atas (topbar)."],
      ["app/workspace.tsx", "RUANG PENGETAHUAN · FRAYAS ACADEMY", "Lencana pada layar sambutan."],
      ["app/workspace.tsx", "Bukan ketentuan resmi Frayas Academy", "Catatan kaki di atas kolom tanya."],
      ["app/workspace.tsx", "AIKITA — asisten pengetahuan…", "Deskripsi dialog privasi."],
      ["app/workspace.tsx", "AIKITA-ringkasan.docx, AIKITA-presentasi.pptx, AIKITA-referensi.png", "Nama berkas ekspor."],
      ["app/workspace.tsx", "AIKITA / PETA REFERENSI", "Judul pada gambar peta sumber (PNG)."],
      ["app/document-studio.tsx", "AIKITA / INTISARI DOKUMEN, AIKITA-slide-deck.pptx, AIKITA-flashcards.csv", "Keluaran Studio."],
      ["public/favicon.svg", "teks 'A'", "Ikon tab; ganti huruf/ gambar sesuai logo."],
      ["README.md", "judul & meja konversi", "Dokumen pembaca proyek."],
    ],
  ),
  spacer(),
  p("Catatan: string 'DATA DUMMY' pada dokumen contoh dipakai regex di app/retrieval.ts dan app/study-engine.ts untuk membuang penanda awal. Bila teks itu diubah, perbarui juga kedua regex tersebut."),
);

// 10
children.push(
  h1("10. Kustomisasi Konten dan Data Awal"),
  p("Seluruh data awal berada di app/data.ts:"),
  bullet("initialDocs: 8 dokumen contoh (judul, kategori, versi, status, klasifikasi, isi)."),
  bullet("initialState(): status penyiapan (setup), mode peran, daftar pengguna contoh, serta entri log pertama."),
  spacer(),
  pBold("Menambah/mengubah dokumen contoh"),
  code(`// app/data.ts — tambahkan objek baru pada initialDocs
{id:'d9',title:'Pedoman Kerja Praktik Frayas Academy',category:'Pendidikan',
 version:1,status:'Aktif',access:'Internal',date:'2026-10-01',
 content:'DATA DUMMY — BUKAN KETENTUAN RESMI. Isi pedoman di sini…'}`),
  bullet("status 'Aktif' membuat dokumen langsung menjadi sumber jawaban setelah referensi diaktifkan; 'Menunggu' menunggu persetujuan admin."),
  bullet("access 'Internal' terlihat untuk semua peran; 'Terbatas (demo)' hanya untuk Admin."),
  bullet("category muncul pada filter pustaka dan grafik 'Kesehatan pustaka' di dashboard — pastikan daftar kategori di app/workspace.tsx (panel dashboard) ikut diperbarui."),
  spacer(),
  pBold("Menambah dokumen lewat aplikasi"),
  bullet("Menu Pustaka dokumen → Unggah dokumen (TXT/DOCX/PDF) — admin langsung aktif, anggota berstatus Menunggu."),
  bullet("Menu Penyiapan referensi (admin) → pilih folder → proses/OCR → Tinjau teks → Simpan → Aktifkan. Gate: asisten dan Studio dikunci sampai aktivasi selesai."),
);

// 11
children.push(
  h1("11. Kustomisasi Peran dan Alur"),
  p("Nilai peran disimpan sebagai string 'Admin' dan 'Anggota'. Bila ingin menamainya ulang (mis. 'Dosen'/'Peserta'), ganti secara konsisten di:"),
  code(`app/data.ts            mode:'Anggota', role:'Anggota'
app/api/workspace/route.ts   ['Admin','Anggota'].includes(payload.mode)
app/workspace.tsx       useState('Anggota'), d.mode||'Anggota',
                        <SelectItem value="Anggota">`),
  spacer(),
  bullet("Aksi admin (status, user, invite, initialize, stageDummy) ditolak server saat mode Anggota — penegakan ada di rute, bukan hanya UI."),
  bullet("Penyaringan tampilan dilakukan visibleState() di app/retrieval.ts: dokumen non-Internal, pengguna, log, dan riwayat peran lain tidak dikirim ke browser."),
  bullet("Gerbang setup (setup.ready) mengunci asisten, unggahan, dan Studio sampai admin mengaktifkan referensi awal."),
);

// 12
children.push(
  h1("12. Kustomisasi Retrieval"),
  p("app/retrieval.ts sangat ringan dan mudah disetel:"),
  bullet("Tokenisasi: pecah non-alfabet, buang kata berlen <= 2 dan daftar stopword (kata umum bahasa Indonesia)."),
  bullet("Potongan: tiap dokumen dipotong per 3 kalimat, dengan penanda [Halaman N] dipertahankan untuk kutipan halaman."),
  bullet("Skor: +2 per kata kunci yang ada di potongan, +1 per kecocokan di judul; urut turun, ambil 4 teratas."),
  bullet("Filter wajib sebelum retrieval: dokumen berstatus Aktif dan (Admin: semua klasifikasi; Anggota: klasifikasi Internal saja)."),
  spacer(),
  pBold("Ide pengembangan"),
  bullet("Tambahkan BM25 atau embedding lokal (mis. nomic-embed-text via Ollama) lalu simpan vektor di SQLite/ sqlite-vec."),
  bullet("Naikkan jumlah potongan (slice(0,4)) atau tambahkan ambang skor minimum untuk mengurangi sumber tidak relevan."),
);

// 13
children.push(
  h1("13. Kustomisasi UI dan Komponen"),
  bullet("Komponen shadcn/ui berada di components/ui (sumber lokal, tanpa CDN registry saat runtime)."),
  bullet("Gaya global: app/globals.css (Tailwind CSS 4, impor tailwindcss, tw-animate-css, dan vendor/shadcn-tailwind-4.13.0.css)."),
  bullet("Tema warna: variabel :root dan blok gelap sidebar pada app/globals.css; warna aksen utama #215c9c/#10243c."),
  bullet("Menambah komponen baru: gunakan komponen serupa di components/ui, atau daftarkan di components.json bila memakai CLI shadcn."),
  bullet("Ikon: lucide-react (mis. <Sparkles size={18}/> pada item menu sidebar app/workspace.tsx)."),
  spacer(),
  p("Struktur halaman: sidebar (brand, percakapan baru, menu Asisten/Pustaka/Studio, menu admin, riwayat, kartu privasi, akun) dan area utama (chat, pustaka, pengguna, log, dashboard, penyiapan, Studio). Semua tampilan dikendalikan oleh state view di app/workspace.tsx."),
);

// 14
children.push(
  h1("14. Ekstraksi Dokumen (PDF/OCR) Lokal"),
  bullet("Mesin disajikan dari public/engines: pdf.worker.min.mjs, cmaps, standard_fonts, wasm; worker.min.js + core WASM Tesseract; bahasa ind.traineddata.gz dan eng.traineddata.gz."),
  bullet("Alur: TXT/DOCX dibaca langsung (mammoth untuk DOCX); PDF dibaca PDF.js; halaman dengan < 60 karakter nonspasi (atau semua halaman bila opsi paksa OCR aktif) diproses OCR."),
  bullet("Hasil ekstraksi berupa teks per halaman dengan penanda [Halaman N · metode] sehingga kutipan mempertahankan nomor halaman."),
  bullet("Semua berjalan di perangkat; tidak ada layanan OCR/LLM eksternal. PDF terkunci kata sandi diminta dibuka terlebih dahulu."),
  spacer(),
  p("Untuk menambah bahasa OCR: letakkan berkas .traineddata.gz di public/engines/ocr/lang lalu tambahkan kode bahasa pada pemanggilan createWorker(['ind','eng']) di app/document-engine.ts dan app/knowledge-setup.tsx."),
);

// 15
children.push(
  h1("15. Keamanan dan Bawa ke Pemakaian Nyata"),
  bullet("Ganti AIKITA_USER, AIKITA_PASS, dan AIKITA_SESSION_SECRET sejak awal; jangan memakai default."),
  bullet("Server vinext mendengarkan 0.0.0.0:3000 — batasi ke 127.0.0.1 atau pasang reverse proxy TLS bila diakses jaringan."),
  bullet("Aktifkan enkripsi at rest untuk folder data/ (mis. volume terenkripsi) karena SQLite dan blobs berisi teks dokumen."),
  bullet("Jadwalkan backup data/aikita.db dan data/blobs; uji proses pemulihan."),
  bullet("Bila menambahkan LLM di luar mesin, pahami bahwa prompt berisi kutipan dokumen akan dikirim ke endpoint tersebut — pertahankan endpoint loopback."),
  bullet("Aktifkan penegakan otorisasi berbasis unit/klasifikasi bila multi-pengguna: saat ini pemisahan per peran demo, bukan per organisasi."),
  bullet("Validasi unggahan tetap ada (ekstensi, ukuran, batas karakter); tambahkan pemindai malware bila menerima berkas dari pihak lain."),
);

// 16
children.push(
  h1("16. Pemecahan Masalah"),
  table(
    ["Gejala", "Kemungkinan penyebab", "Tindakan"],
    [
      ["Halaman kosong / 404", "Belum build atau server salah folder", "Jalankan pnpm build lalu pnpm start dari folder AIKITA."],
      ["Login selalu ditolak", "Kredensial tidak cocok / .env.local belum dimuat", "Periksa AIKITA_USER & AIKITA_PASS; restart server setelah mengubah .env.local."],
      ["Peserta logout sendiri", "AIKITA_SESSION_SECRET berubah antar proses", "Tetapkan nilai tetap di .env.local."],
      ["API 401 Silakan login dahulu", "Cookie tidak terkirim", "Login ulang melalui /login; pastikan memakai origin yang sama."],
      ["Jawaban selalu kutipan, bukan LLM", "Runtime LLM mati / URL salah", "Cek AIKITA_LLM_URL, jalankan ollama serve, uji dengan curl (bagian 8.1)."],
      ["Jawaban LLM lambat/lapor timeout", "Model terlalu besar untuk perangkat", "Turunkan model atau naikkan AIKITA_LLM_TIMEOUT_MS."],
      ["'Admin harus menyiapkan referensi awal'", "Gerbang setup belum selesai", "Masuk sebagai Admin → Penyiapan referensi → proses & aktifkan (atau tombol dokumen contoh)."],
      ["'Kapasitas demo penuh'", "JSON ruang kerja melebihi ~1,8 MB", "Hapus dokumen Studio/riwayat, atau unggah dokumen lebih kecil."],
      ["OCR selalu aktif meski PDF ber-teks", "Opsi paksa OCR tercentang", "Nonaktifkan opsi 'Paksa OCR seluruh halaman PDF'."],
      ["node:sqlite tidak ditemukan", "Node.js < 22.13", "Perbarui Node.js ke LTS terbaru."],
      ["pnpm lint gagal", "Masalah lama dari kode asli (no-explicit-any) dan berkas vendor public/engines", "Abaikan untuk penggunaan normal; lint bukan syarat build (typecheck & build lulus)."],
    ],
  ),
  spacer(),
);

// 17
children.push(
  h1("17. Checklist Kustomisasi"),
  bullet("[ ] Ganti AIKITA_USER, AIKITA_PASS, AIKITA_SESSION_SECRET di .env.local."),
  bullet("[ ] Sesuaikan nama organisasi/branding (bagian 9) bila bukan Frayas Academy."),
  bullet("[ ] Ganti/misi dokumen contoh di app/data.ts sesuai konteks lembaga."),
  bullet("[ ] Siapkan referensi awal lewat Penyiapan referensi (admin)."),
  bullet("[ ] Jalankan LLM lokal dan set AIKITA_LLM_URL/AIKITA_LLM_MODEL (opsional)."),
  bullet("[ ] Uji alur: masuk → aktifkan referensi → tanya → periksa sumber → ekspor Word/PowerPoint/PNG."),
  bullet("[ ] Atur backup rutin untuk data/aikita.db dan data/blobs."),
  bullet("[ ] Tinjau bagian 15 sebelum diakses banyak pengguna."),
  spacer(),
  p("Selesai. Dokumen ini dapat dibuat ulang kapan pun dengan perintah pnpm docs."),
);

const doc = new Document({
  creator: "AIKITA",
  title: "Dokumentasi Kustomisasi AIKITA",
  description: "Panduan kustomisasi AIKITA — Asisten Pengetahuan Frayas Academy",
  sections: [{ children }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log("Tulis:", OUT, `(${buf.length} byte)`);
});
