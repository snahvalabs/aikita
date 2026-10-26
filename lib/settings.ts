import { getDb } from "../db";

// ---------------------------------------------------------------------------
// Pengaturan global AIKITA (disimpan di tabel `settings`, bukan hanya env).
//   - llm      : koneksi ke server lokal gaya OpenAI (Ollama, LM Studio, dll.)
//   - ingestion: mode baca dokumen — 'ocr' (Tesseract) atau 'langchain'
//                (pemuat -> pemecah potongan -> rantai QA).
// Nilai `.env.local` dipakai sebagai nilai bawaan sebelum admin menyimpan
// pengaturan lewat UI.
// ---------------------------------------------------------------------------

export type IngestionMode = "ocr" | "langchain";

export type LLMSettings = {
  enabled: boolean;
  url: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
};

export type AppSettings = {
  llm: LLMSettings;
  ingestion: { mode: IngestionMode };
};

const SETTINGS_KEY = "app";
const DEFAULT_LLM_URL = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "llama3.2";

export function defaultSettings(): AppSettings {
  const rawUrl = process.env.AIKITA_LLM_URL || DEFAULT_LLM_URL;
  return {
    llm: {
      enabled: String(process.env.AIKITA_LLM_ENABLED ?? "true").toLowerCase() !== "false",
      url: rawUrl,
      model: process.env.AIKITA_LLM_MODEL || DEFAULT_MODEL,
      apiKey: process.env.AIKITA_LLM_API_KEY || "",
      timeoutMs: Number(process.env.AIKITA_LLM_TIMEOUT_MS || 20000),
    },
    ingestion: {
      mode: String(process.env.AIKITA_INGESTION_MODE || "").toLowerCase() === "langchain"
        ? "langchain"
        : "ocr",
    },
  };
}

function merge(base: AppSettings, stored: any): AppSettings {
  if (!stored || typeof stored !== "object") return base;
  const llm = (stored.llm && typeof stored.llm === "object" ? stored.llm : {}) as Partial<LLMSettings>;
  const ingestion = (stored.ingestion && typeof stored.ingestion === "object"
    ? stored.ingestion
    : {}) as Partial<AppSettings["ingestion"]>;
  return {
    llm: {
      enabled: typeof llm.enabled === "boolean" ? llm.enabled : base.llm.enabled,
      url: typeof llm.url === "string" && llm.url.trim() ? llm.url.trim() : base.llm.url,
      model: typeof llm.model === "string" && llm.model.trim() ? llm.model.trim() : base.llm.model,
      apiKey: typeof llm.apiKey === "string" ? llm.apiKey : base.llm.apiKey,
      timeoutMs:
        typeof llm.timeoutMs === "number" && Number.isFinite(llm.timeoutMs)
          ? Math.min(300000, Math.max(2000, Math.round(llm.timeoutMs)))
          : base.llm.timeoutMs,
    },
    ingestion: {
      mode: ingestion.mode === "langchain" ? "langchain" : ingestion.mode === "ocr" ? "ocr" : base.ingestion.mode,
    },
  };
}

export async function getAppSettings(): Promise<AppSettings> {
  const row = await getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .bind(SETTINGS_KEY)
    .first();
  if (!row) return defaultSettings();
  try {
    return merge(defaultSettings(), JSON.parse(String(row.value)));
  } catch {
    return defaultSettings();
  }
}

function validate(input: any): AppSettings {
  const base = defaultSettings();
  if (!input || typeof input !== "object") throw new Error("Pengaturan tidak valid.");
  const llm = input.llm && typeof input.llm === "object" ? input.llm : {};
  const ingestion = input.ingestion && typeof input.ingestion === "object" ? input.ingestion : {};

  const url = String(llm.url ?? base.llm.url).trim();
  if (!/^https?:\/\/.+/i.test(url)) {
    throw new Error("URL server LLM harus diawali http:// atau https:// misalnya http://127.0.0.1:11434");
  }
  const model = String(llm.model ?? base.llm.model).trim();
  if (!model || model.length > 120) throw new Error("Nama model wajib diisi (maksimal 120 karakter).");
  const timeoutRaw = Number(llm.timeoutMs ?? base.llm.timeoutMs);
  if (!Number.isFinite(timeoutRaw) || timeoutRaw < 2000 || timeoutRaw > 300000) {
    throw new Error("Batas waktu harus antara 2.000 dan 300.000 milidetik.");
  }
  const mode = String(ingestion.mode ?? base.ingestion.mode);
  if (mode !== "ocr" && mode !== "langchain") throw new Error("Mode baca dokumen tidak dikenal.");

  return {
    llm: {
      enabled: llm.enabled !== false,
      url,
      model,
      apiKey: typeof llm.apiKey === "string" ? llm.apiKey.trim().slice(0, 400) : "",
      timeoutMs: Math.round(timeoutRaw),
    },
    ingestion: { mode: mode as IngestionMode },
  };
}

export async function saveAppSettings(input: unknown): Promise<AppSettings> {
  const settings = validate(input);
  const value = JSON.stringify(settings);
  await getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .bind(SETTINGS_KEY, value)
    .run();
  return settings;
}

/** Tampilkan hanya sebagian konfigurasi LLM kepada non-admin (kunci tidak dibagikan). */
export function maskSettingsFor(settings: AppSettings, isAdmin: boolean): AppSettings {
  if (isAdmin) return settings;
  return {
    llm: { ...settings.llm, url: "", apiKey: "" },
    ingestion: settings.ingestion,
  };
}
