import { z } from "zod";
import { json, PUBLIC_CACHE } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/security";
import { getRelease } from "@/services/releases";

export const dynamic = "force-dynamic";

const idSchema = z.string().min(1).max(120).regex(/^[A-Za-z0-9_:-]+$/);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(`api:${clientIp(request)}`, 60, 60_000);
  if (!rl.ok) return json({ error: "rate_limited" }, 429, { "Retry-After": String(rl.retryAfter) });

  const parsed = idSchema.safeParse((await params).id);
  if (!parsed.success) return json({ error: "invalid_id" }, 400);

  const release = await getRelease(parsed.data);
  if (!release) return json({ error: "not_found" }, 404);
  return json({ data: release }, 200, PUBLIC_CACHE);
}
