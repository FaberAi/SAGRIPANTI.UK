/**
 * Sessione utente: l'id utente firmato HMAC-SHA256 con AUTH_TOKEN.
 * Usa Web Crypto (`crypto.subtle`) per funzionare sia nel middleware (Edge)
 * sia nelle route handler (Node).
 */
const enc = new TextEncoder();

const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(process.env.AUTH_TOKEN ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
}

export async function signSession(userId: number): Promise<string> {
  const payload = String(userId);
  return `${payload}.${await hmac(payload)}`;
}

/** Verifica il token di sessione e restituisce l'id utente, o null. */
export async function verifySession(
  token: string | undefined | null
): Promise<number | null> {
  if (!token || !process.env.AUTH_TOKEN) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await hmac(payload);
  if (sig.length !== expected.length) return null;
  // confronto a tempo costante
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  const id = parseInt(payload, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const SESSION_COOKIE = "saguk_session";

/** Estrae l'id utente dalla sessione di una richiesta (route handler). */
export async function getUserId(
  req: { cookies: { get: (n: string) => { value: string } | undefined } }
): Promise<number | null> {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value);
}
