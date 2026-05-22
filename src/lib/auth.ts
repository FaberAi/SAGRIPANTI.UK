import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * Hashing password con scrypt — nessuna dipendenza esterna.
 * Formato memorizzato: `salt:hash` (entrambi esadecimali). Solo lato server.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(test, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
