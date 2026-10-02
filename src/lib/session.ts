/**
 * Token sesi admin bertanda tangan HMAC-SHA256 (Web Crypto → jalan di middleware Edge maupun Node).
 * Format: v1.<kedaluwarsa-epoch-detik>.<tanda-tangan-hex>. Kunci diturunkan dari ADMIN_PASSWORD + CRON_SECRET,
 * jadi mengganti salah satunya otomatis mengeluarkan semua sesi. Tidak ada data pengguna di dalam token.
 */
const enc = new TextEncoder();

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 jam

export const sessionSecret = (adminPassword: string, cronSecret: string) => `${adminPassword}:${cronSecret}`;

const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

function fromHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

const importKey = (secret: string, usage: KeyUsage[]) =>
  crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usage);

export async function createSessionToken(secret: string, nowMs = Date.now(), ttlSeconds = SESSION_TTL_SECONDS) {
  const exp = Math.floor(nowMs / 1000) + ttlSeconds;
  const payload = `v1.${exp}`;
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret, ["sign"]), enc.encode(payload));
  return `${payload}.${toHex(signature)}`;
}

export async function verifySessionToken(
  secret: string,
  token: string | null | undefined,
  nowMs = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const exp = Number(parts[1]);
  if (!Number.isInteger(exp) || exp * 1000 < nowMs) return false;
  const signature = fromHex(parts[2] ?? "");
  if (!signature) return false;
  // crypto.subtle.verify membandingkan secara constant-time.
  return crypto.subtle.verify("HMAC", await importKey(secret, ["verify"]), signature, enc.encode(`v1.${parts[1]}`));
}
