import { revalidatePath } from "next/cache";
import { json } from "@/lib/api";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, verifyBearer } from "@/lib/security";
import { syncMusic } from "@/services/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Dilindungi Authorization: Bearer <CRON_SECRET>.
 * GET dipakai Vercel Cron (cron selalu memanggil dengan GET), POST untuk pemanggilan manual.
 * Tambahkan ?force=1 untuk melewati cooldown 10 menit.
 */
async function handle(request: Request) {
  const rl = rateLimit(`sync:${clientIp(request)}`, 20, 60_000);
  if (!rl.ok) return json({ ok: false, error: "rate_limited" }, 429, { "Retry-After": String(rl.retryAfter) });

  const auth = verifyBearer(request);
  if (auth === "disabled") return json({ ok: false, error: "sync_disabled" }, 503);
  if (auth !== "ok") return json({ ok: false, error: "unauthorized" }, 401);

  const force = new URL(request.url).searchParams.get("force") === "1";
  try {
    const result = await syncMusic({ force });
    if (!result.skipped) revalidatePath("/", "layout");
    return json({ ok: true, ...result });
  } catch (error) {
    logger.error("sync route failed", { error });
    // Detail error hanya di log server dan halaman admin — tidak dikirim ke client.
    return json({ ok: false, error: "sync_failed" }, 502);
  }
}

export const GET = handle;
export const POST = handle;
