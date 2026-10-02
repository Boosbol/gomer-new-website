import { json, PUBLIC_CACHE } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/security";
import { loadReleases } from "@/services/releases";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rl = rateLimit(`api:${clientIp(request)}`, 60, 60_000);
  if (!rl.ok) return json({ error: "rate_limited" }, 429, { "Retry-After": String(rl.retryAfter) });

  const raw = Number(new URL(request.url).searchParams.get("limit") ?? "1");
  const limit = Number.isFinite(raw) ? Math.min(12, Math.max(1, Math.trunc(raw))) : 1;
  const { items, source } = await loadReleases();
  return json({ data: items.slice(0, limit), meta: { count: Math.min(limit, items.length), source } }, 200, PUBLIC_CACHE);
}
