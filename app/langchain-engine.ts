// ---------------------------------------------------------------------------
// Pipeline baca dokumen gaya LangChain — dijalankan lokal tanpa dependensi baru
// (setara dengan rangkaian Document Loader -> Text Splitter -> Retriever ->
// Retrieval QA Chain, namun ringan dan sepenuhnya offline).
//   1. Pemuat (loader)      : app/document-engine.ts (TXT, DOCX, lapisan teks PDF)
//   2. Pemecah potongan     : splitText / chunkDocument (di sini)
//   3. Penelusur (retriever): langchainRetrieve (di sini)
//   4. Rantai QA            : prompt + LLM lokal di lib/local-llm.ts
// Mode ini menjadi alternatif OCR dan diaktifkan lewat Pengaturan AI admin.
// ---------------------------------------------------------------------------

export type Chunk = { text: string; section: number; page: number | null };

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;

const SEPARATORS = ["\n\n", "\n", ". ", " ", ""];
const STOPWORDS = new Set(
  "apa saja yang dan di ke dari untuk dalam dengan bagaimana buat jelaskan ringkas tentang saya ini itu sebuah tabel gambar presentasi data dummy bukan ketentuan resmi halaman".split(
    " ",
  ),
);

// Pemecah karakter rekrusif, mengikuti strategi RecursiveCharacterTextSplitter:
// coba pemisah panjang dulu, lalu turun sampai pemisah terkecil.
function splitRecursive(text: string, separators: string[], size: number): string[] {
  if (text.length <= size) return [text];
  for (const separator of separators) {
    if (separator === "") break;
    if (!text.includes(separator)) continue;
    const rest = separators.slice(separators.indexOf(separator) + 1);
    const pieces = text.split(separator);
    const out: string[] = [];
    pieces.forEach((piece, index) => {
      const withSep = index < pieces.length - 1 ? piece + separator : piece;
      if (!withSep) return;
      if (withSep.length <= size) out.push(withSep);
      else out.push(...splitRecursive(withSep, rest, size));
    });
    if (out.length) return out;
  }
  // Pemisah tidak terpakai (mis. satu kata raksasa) — potong paksa.
  const hard: string[] = [];
  for (let i = 0; i < text.length; i += size) hard.push(text.slice(i, i + size));
  return hard;
}

function mergePieces(pieces: string[], size: number): string[] {
  const merged: string[] = [];
  let buffer = "";
  for (const piece of pieces) {
    if (!buffer) buffer = piece;
    else if (buffer.length + piece.length <= size) buffer += piece;
    else {
      merged.push(buffer);
      buffer = piece;
    }
  }
  if (buffer) merged.push(buffer);
  return merged;
}

/** Pecah teks menjadi potongan tumpang tindih (chunk overlap ala LangChain). */
export function splitText(
  text: string,
  options: { chunkSize?: number; chunkOverlap?: number } = {},
): { text: string; index: number }[] {
  const size = Math.max(200, options.chunkSize || CHUNK_SIZE);
  const overlap = Math.min(Math.max(0, options.chunkOverlap ?? CHUNK_OVERLAP), Math.floor(size / 2));
  const clean = String(text || "").replace(/\r/g, "").trim();
  if (!clean) return [];
  const pieces = mergePieces(splitRecursive(clean, SEPARATORS, size), size);
  const out: { text: string; index: number }[] = [];
  pieces.forEach((piece, index) => {
    const trimmed = piece.trim();
    if (!trimmed) return;
    const previous = out[out.length - 1];
    const head = overlap > 0 && previous ? tailOf(previous.text, overlap) : "";
    out.push({ text: head ? head + trimmed : trimmed, index: out.length });
  });
  return out;
}

function tailOf(value: string, length: number): string {
  if (value.length <= length) return "";
  const slice = value.slice(value.length - length);
  const boundary = slice.indexOf(" ");
  return (boundary > -1 ? slice.slice(boundary + 1) : slice).trim();
}

function pageMarkers(content: string): { match: RegExpExecArray; page: number }[] {
  const out: { match: RegExpExecArray; page: number }[] = [];
  const re = /\[Halaman (\d+)[^\]]*\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content))) out.push({ match, page: Number(match[1]) });
  return out;
}

const chunkCache = new Map<string, Chunk[]>();
const CACHE_LIMIT = 50;

/**
 * Pecah isi dokumen menjadi potongan berpagu halaman, siap ditelusuri.
//  Hasil disimpan singkat pada memori agar dokumen besar tidak dipecah ulang
 * setiap percakapan.
 */
export function chunkDocument(
  content: string,
  options: { chunkSize?: number; chunkOverlap?: number; cacheKey?: string } = {},
): Chunk[] {
  const key = options.cacheKey
    ? `${options.cacheKey}:${content.length}:${options.chunkSize || CHUNK_SIZE}`
    : "";
  if (key) {
    const hit = chunkCache.get(key);
    if (hit) return hit;
  }
  const markers = pageMarkers(content);
  const chunks: Chunk[] = [];
  const sections: { start: number; end: number; page: number | null }[] = [];
  if (!markers.length) {
    sections.push({ start: 0, end: content.length, page: null });
  } else {
    if (markers[0].match.index > 0) {
      sections.push({ start: 0, end: markers[0].match.index, page: null });
    }
    markers.forEach((marker, index) => {
      const start = marker.match.index + marker.match[0].length;
      const end = index + 1 < markers.length ? markers[index + 1].match.index : content.length;
      sections.push({ start, end, page: marker.page });
    });
  }
  for (const section of sections) {
    const text = content.slice(section.start, section.end).trim();
    if (!text) continue;
    for (const piece of splitText(text, options)) {
      chunks.push({ text: piece.text, section: chunks.length + 1, page: section.page });
    }
  }
  if (key) {
    if (chunkCache.size >= CACHE_LIMIT) {
      const oldest = chunkCache.keys().next().value;
      if (oldest) chunkCache.delete(oldest);
    }
    chunkCache.set(key, chunks);
  }
  return chunks;
}

function termsOf(query: string): string[] {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
    ),
  );
}

/**
 * Retriever gaya LangChain: dokumen aktif -> potongan -> skor kemiripan kata
 * kunci -> potongan teratas. Menghasilkan struktur sumber yang sama dengan
 * penelusuran OCR sehingga UI dan LLM lokal tetap bekerja tanpa perubahan.
 */
export function langchainRetrieve(
  query: string,
  docs: any[],
  options: { chunkSize?: number; chunkOverlap?: number } = {},
): any[] {
  const terms = termsOf(query);
  if (!terms.length) return [];
  const results: any[] = [];
  for (const doc of docs) {
    const title = String(doc.title || "").toLowerCase();
    const chunks = chunkDocument(String(doc.content || ""), {
      ...options,
      cacheKey: `${doc.id || doc.title}:${doc.version || 1}`,
    });
    for (const chunk of chunks) {
      const text = chunk.text.toLowerCase();
      let score = 0;
      for (const term of terms) {
        const hits = text.split(term).length - 1;
        if (hits > 0) score += 2 + Math.min(hits, 3);
        if (title.includes(term)) score += 1;
      }
      if (score > 0) {
        results.push({ ...doc, content: chunk.text, section: chunk.section, page: chunk.page, score });
      }
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 4);
}
