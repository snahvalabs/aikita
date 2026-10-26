import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Basis data lokal AIKITA (SQLite) — menggantikan Cloudflare D1.
// File database: <AIKITA_DATA_DIR>/aikita.db (default: ./data/aikita.db).
// Lapisan kecil di bawah ini meniru API D1 (prepare/bind/first/run) agar
// kode rute tetap sama persis dengan versi aslinya.
// ---------------------------------------------------------------------------

export function dataDir(): string {
  const dir = process.env.AIKITA_DATA_DIR
    ? path.resolve(process.env.AIKITA_DATA_DIR)
    : path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

let instance: DatabaseSync | null = null;

function database(): DatabaseSync {
  if (!instance) {
    const file = path.join(dataDir(), "aikita.db");
    instance = new DatabaseSync(file);
    instance.exec(
      [
        "CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL)",
        // Akun login nyata yang didaftarkan admin (username + kata sandi ter-hash scrypt).
        `CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY NOT NULL,
          username TEXT NOT NULL COLLATE NOCASE,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
        "CREATE UNIQUE INDEX IF NOT EXISTS accounts_username_idx ON accounts (username)",
        // Pengaturan global aplikasi (konfigurasi Ollama/LLM dan mode baca dokumen).
        "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)",
      ].join(";"),
    );
  }
  return instance;
}

type Param = string | number | bigint | null | Uint8Array;

class LocalStatement {
  private params: Param[] = [];
  constructor(private readonly sql: string) {}
  bind(...params: Param[]): this {
    this.params = params;
    return this;
  }
  async first(): Promise<Record<string, unknown> | null> {
    const row = database().prepare(this.sql).get(...this.params) as
      | Record<string, unknown>
      | undefined;
    return row ?? null;
  }
  async run(): Promise<{ success: true }> {
    database().prepare(this.sql).run(...this.params);
    return { success: true };
  }
  async all(): Promise<Record<string, unknown>[]> {
    return database().prepare(this.sql).all(...this.params) as Record<string, unknown>[];
  }
}

class LocalDatabase {
  prepare(sql: string): LocalStatement {
    return new LocalStatement(sql);
  }
}

export function getDb(): LocalDatabase {
  return new LocalDatabase();
}
