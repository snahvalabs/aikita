import crypto from "node:crypto";
import { getDb } from "../db";

// ---------------------------------------------------------------------------
// Akun login lokal AIKITA — admin mendaftarkan akun (username + kata sandi),
// pengguna langsung masuk lewat halaman /login tanpa layanan eksternal.
// Kata sandi disimpan sebagai hash scrypt + salt acak, bukan teks biasa.
// ---------------------------------------------------------------------------

export type AccountRole = "Admin" | "Anggota";
export type AccountStatus = "Aktif" | "Nonaktif";

export type Account = {
  id: string;
  username: string;
  role: AccountRole;
  status: AccountStatus;
  createdAt: string;
  passwordHash?: never;
  salt?: never;
};

type Row = Record<string, unknown>;

const MIN_PASSWORD = 6;
const MAX_PASSWORD = 200;

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  if (!password || !salt || !hash) return false;
  const candidate = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length || candidate.length === 0) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

function toAccount(row: Row): Account {
  return {
    id: String(row.id),
    username: String(row.username),
    role: (row.role === "Admin" ? "Admin" : "Anggota") as AccountRole,
    status: (row.status === "Nonaktif" ? "Nonaktif" : "Aktif") as AccountStatus,
    createdAt: String(row.created_at || ""),
  };
}

export function normalizeUsername(username: string): string {
  const value = String(username || "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(value)) {
    throw new Error(
      "Nama pengguna 3–32 karakter: huruf kecil, angka, titik, garis bawah, atau tanda minus.",
    );
  }
  return value;
}

export function assertPasswordStrength(password: string): string {
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    throw new Error(`Kata sandi minimal ${MIN_PASSWORD} karakter.`);
  }
  if (password.length > MAX_PASSWORD) {
    throw new Error(`Kata sandi maksimal ${MAX_PASSWORD} karakter.`);
  }
  return password;
}

export async function findAccount(username: string): Promise<Row | null> {
  const row = await getDb()
    .prepare("SELECT * FROM accounts WHERE username = ? LIMIT 1")
    .bind(String(username || "").trim())
    .first();
  return row ?? null;
}

export async function listAccounts(): Promise<Account[]> {
  const rows = await getDb().prepare("SELECT * FROM accounts ORDER BY created_at DESC, username").all();
  return rows.map(toAccount);
}

export async function getAccount(id: string): Promise<Row | null> {
  const row = await getDb().prepare("SELECT * FROM accounts WHERE id = ? LIMIT 1").bind(id).first();
  return row ?? null;
}

export async function createAccount(input: {
  username: string;
  password: string;
  role?: string;
}): Promise<Account> {
  const username = normalizeUsername(input.username);
  const password = assertPasswordStrength(input.password);
  const role: AccountRole = input.role === "Admin" ? "Admin" : "Anggota";
  if (await findAccount(username)) throw new Error("Nama pengguna sudah terdaftar.");
  const salt = crypto.randomBytes(16).toString("hex");
  const id = crypto.randomUUID();
  await getDb()
    .prepare(
      "INSERT INTO accounts (id, username, password_hash, salt, role, status, created_at) VALUES (?,?,?,?,?,?,?)",
    )
    .bind(id, username, hashPassword(password, salt), salt, role, "Aktif", new Date().toISOString())
    .run();
  return { id, username, role, status: "Aktif", createdAt: new Date().toISOString() };
}

export async function updateAccount(
  id: string,
  patch: { status?: string; role?: string },
): Promise<Account> {
  const row = await getAccount(id);
  if (!row) throw new Error("Akun tidak ditemukan.");
  const role: AccountRole | null =
    patch.role === "Admin" ? "Admin" : patch.role === "Anggota" ? "Anggota" : null;
  const status: AccountStatus | null =
    patch.status === "Aktif" ? "Aktif" : patch.status === "Nonaktif" ? "Nonaktif" : null;
  const nextRole = role ?? (row.role === "Admin" ? "Admin" : "Anggota");
  const nextStatus = status ?? (row.status === "Nonaktif" ? "Nonaktif" : "Aktif");
  await getDb()
    .prepare("UPDATE accounts SET role = ?, status = ? WHERE id = ?")
    .bind(nextRole, nextStatus, id)
    .run();
  return toAccount({ ...row, role: nextRole, status: nextStatus });
}

export async function resetPassword(id: string, password: string): Promise<void> {
  const row = await getAccount(id);
  if (!row) throw new Error("Akun tidak ditemukan.");
  assertPasswordStrength(password);
  const salt = crypto.randomBytes(16).toString("hex");
  await getDb()
    .prepare("UPDATE accounts SET password_hash = ?, salt = ? WHERE id = ?")
    .bind(hashPassword(password, salt), salt, id)
    .run();
}

export async function removeAccount(id: string): Promise<void> {
  await getDb().prepare("DELETE FROM accounts WHERE id = ?").bind(id).run();
}

/** Akun Admin aktif yang tersisa (untuk mencegah admin terakhir menonaktifkan dirinya). */
export async function countActiveAdmins(exceptId?: string): Promise<number> {
  const rows = await getDb()
    .prepare("SELECT id FROM accounts WHERE role = 'Admin' AND status = 'Aktif'")
    .all();
  const ids = rows.map((r) => String(r.id)).filter((id) => id !== exceptId);
  return ids.length;
}
