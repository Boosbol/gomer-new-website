import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/security";
import { getMediaData } from "@/services/media";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

/** Menyajikan foto yang diunggah lewat admin. ID unik & isi tidak berubah → boleh di-cache lama oleh CDN/browser. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(`media:${clientIp(request)}`, 300, 60_000);
  if (!rl.ok) return new Response("Too many requests", { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

  const parsed = idSchema.safeParse((await params).id);
  if (!parsed.success) return new Response("Not found", { status: 404 });

  let row: Awaited<ReturnType<typeof getMediaData>> = null;
  try {
    row = await getMediaData(parsed.data);
  } catch {
    return new Response("Unavailable", { status: 503 });
  }
  if (!row) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(row.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
