import fs from "node:fs/promises";
import path from "node:path";
import { dataDir } from "../db";

// ---------------------------------------------------------------------------
// Penyimpanan objek lokal — menggantikan bucket Cloudflare R2.
// Berkas versi dokumen disimpan di <AIKITA_DATA_DIR>/blobs/<user>/<doc>/<v>.txt
// ---------------------------------------------------------------------------

function sanitize(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "x";
}

export async function putObject(key: string, body: string): Promise<void> {
  const parts = key.split("/").map(sanitize);
  const file = path.join(dataDir(), "blobs", ...parts) + ".txt";
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body, "utf8");
}

// Hapus seluruh berkas versi milik satu dokumen, berapa pun pengunggahnya.
// Struktur: <blobs>/<user>/<docId>/<v>.txt — dipindai agar dokumen lama
// (sebelum pustaka menjadi bersama) ikut terhapus dan kapasitas memori/bebas.
export async function removeDocumentBlobs(docId: string): Promise<void> {
  const target = sanitize(docId);
  if (!target || target === "." || target === "..") return;
  const root = path.join(dataDir(), "blobs");
  let owners: string[] = [];
  try {
    owners = await fs.readdir(root);
  } catch {
    return;
  }
  for (const owner of owners) {
    if (owner === "." || owner === ".." || owner.includes("/")) continue;
    const dir = path.join(root, owner, target);
    if (!dir.startsWith(root)) continue;
    try {
      const stat = await fs.stat(dir);
      if (stat.isDirectory()) await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // berkas mungkin sudah tidak ada — abaikan
    }
  }
}

export async function getObject(key: string): Promise<string | null> {
  const parts = key.split("/").map(sanitize);
  const file = path.join(dataDir(), "blobs", ...parts) + ".txt";
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}
