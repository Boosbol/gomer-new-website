import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Memeriksa header "Authorization: Bearer <CRON_SECRET>" secara constant-time. */
export function verifyBearer(request: Request): "ok" | "unauthorized" | "disabled" {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 24) return "disabled"; // fail closed: tanpa secret yang kuat, endpoint sync tidak bisa dipakai
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "");
  if (!match || !match[1]) return "unauthorized";
  return safeEqual(match[1].trim(), secret) ? "ok" : "unauthorized";
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
