import { cookies } from "next/headers";
import crypto from "node:crypto";
import { findAccount, verifyPassword } from "../lib/accounts";

// ---------------------------------------------------------------------------
// Autentikasi lokal AIKITA — menggantikan identitas dispatcher ChatGPT.
// Sesi berupa cookie HttpOnly yang ditandatangani HMAC-SHA256, tanpa layanan
// eksternal.
//   1. Akun yang didaftarkan admin (tabel `accounts`, username + kata sandi
//      ter-hash scrypt) — prioritas utama, bisa banyak pengguna.
//   2. Akun bawaan dari .env.local: AIKITA_USER / AIKITA_PASS (default admin).
//   AIKITA_SESSION_SECRET (WAJIB diganti pada pemakaian nyata).
// ---------------------------------------------------------------------------

export type LocalRole = "Admin" | "Anggota";

export type LocalUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
  role: LocalRole;
  accountId: string | null;
};

const SESSION_COOKIE = "aikita_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SIGN_IN_PATH = "/login";

function secret(): string {
  return process.env.AIKITA_SESSION_SECRET || "aikita-ganti-saya-di-env";
}

function hmac(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export async function verifyCredentials(
  username?: string,
  password?: string,
): Promise<LocalUser | null> {
  if (!username || !password) return null;
  const name = username.trim();

  // 1) Akun yang didaftarkan admin melalui menu "Kelola pengguna".
  const account = await findAccount(name);
  if (account) {
    if (account.status !== "Aktif") return null;
    if (!verifyPassword(password, String(account.salt), String(account.password_hash))) return null;
    const id = String(account.id);
    return {
      userId: "acc-" + id,
      accountId: id,
      role: account.role === "Admin" ? "Admin" : "Anggota",
      displayName: String(account.username),
      email: `${String(account.username)}@frayas.local`,
      fullName: null,
    };
  }

  // 2) Akun bawaan dari environment (.env.local).
  const expectedUser = process.env.AIKITA_USER || "admin";
  const expectedPass = process.env.AIKITA_PASS || "admin";
  if (!safeEqual(name, expectedUser) || !safeEqual(password, expectedPass)) {
    return null;
  }
  return {
    userId: "local-" + crypto.createHash("sha256").update(expectedUser).digest("hex").slice(0, 16),
    accountId: null,
    role: "Admin",
    displayName: expectedUser,
    email: `${expectedUser}@frayas.local`,
    fullName: expectedUser,
  };
}

export async function createSessionCookie(user: LocalUser): Promise<string> {
  const payload = Buffer.from(
    JSON.stringify({
      userId: user.userId,
      accountId: user.accountId,
      role: user.role,
      displayName: user.displayName,
      email: user.email,
      fullName: user.fullName,
      exp: Date.now() + SESSION_TTL_MS,
    }),
    "utf8",
  ).toString("base64url");
  const value = `${payload}.${hmac(payload)}`;
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(
    SESSION_TTL_MS / 1000,
  )}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function getLocalUser(): Promise<LocalUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const sep = raw.lastIndexOf(".");
  if (sep < 1) return null;
  const payload = raw.slice(0, sep);
  const signature = raw.slice(sep + 1);
  if (!safeEqual(signature, hmac(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    if (typeof data.userId !== "string") return null;
    // Sesi lama tidak menyimpan peran: hanya akun bawaan environment yang
    // dianggap Admin, sisanya Anggota.
    const envAdmin =
      "local-" +
      crypto
        .createHash("sha256")
        .update(process.env.AIKITA_USER || "admin")
        .digest("hex")
        .slice(0, 16);
    const role: LocalRole =
      data.role === "Admin" || data.role === "Anggota"
        ? data.role
        : data.userId === envAdmin
          ? "Admin"
          : "Anggota";
    return {
      userId: data.userId,
      accountId: typeof data.accountId === "string" ? data.accountId : null,
      role,
      displayName: String(data.displayName || data.email || "pengguna"),
      email: String(data.email || ""),
      fullName: data.fullName ?? null,
    };
  } catch {
    return null;
  }
}

export function signInPath(): string {
  return SIGN_IN_PATH;
}
