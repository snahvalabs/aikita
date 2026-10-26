import { clearSessionCookie, createSessionCookie, verifyCredentials } from "../../local-auth";

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

// POST /api/auth -> masuk (login lokal) atau keluar (action: logout)
export async function POST(req: Request) {
  let body: { action?: string; username?: string; password?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Permintaan tidak valid." }, 400);
  }

  if (body?.action === "logout") {
    return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
  }

  const user = await verifyCredentials(
    typeof body?.username === "string" ? body.username.trim() : undefined,
    typeof body?.password === "string" ? body.password : undefined,
  );
  if (!user) {
    return json(
      { error: "Nama pengguna atau kata sandi salah, atau akun dinonaktifkan admin." },
      401,
    );
  }

  const cookie = await createSessionCookie(user);
  return json(
    { ok: true, user: { displayName: user.displayName, email: user.email, role: user.role } },
    200,
    { "Set-Cookie": cookie },
  );
}

