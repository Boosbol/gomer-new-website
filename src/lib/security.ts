import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { getEnv } from "./env";

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Memeriksa header "Authorization: Bearer <CRON_SECRET>" secara constant-time. */
export function verifyBearer(request: Request): "ok" | "unauthorized" | "disabled" {
  let secret: string | undefined;
  try {
    secret = getEnv().CRON_SECRET;
  } catch {
    return "disabled";
  }
  if (!secret) return "disabled"; // fail closed: tanpa secret, endpoint sync tidak bisa dipakai
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "");
  if (!match || !match[1]) return "unauthorized";
  return safeEqual(match[1].trim(), secret) ? "ok" : "unauthorized";
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
