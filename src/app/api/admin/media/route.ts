import { revalidatePath } from "next/cache";
import { json } from "@/lib/api";
import { isAdmin, isSameOrigin } from "@/lib/admin-auth";
import { sniffImageMime } from "@/lib/image-sniff";
import { logger } from "@/lib/logger";
import { insertMedia } from "@/services/media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 1_500_000; // browser mengecilkan foto lebih dulu; batas ini hanya pengaman
const dimension = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n <= 20_000 ? n : null;
};

/** Unggah foto (dilindungi sesi admin + pemeriksaan Origin). Tipe file ditentukan dari isinya, bukan dari klaim klien. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return json({ ok: false, error: "unauthorized" }, 401);
  if (!isSameOrigin(request)) return json({ ok: false, error: "forbidden" }, 403);

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES + 100_000) return json({ ok: false, error: "too_large" }, 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return json({ ok: false, error: "no_file" }, 400);
  if (file.size > MAX_BYTES) return json({ ok: false, error: "too_large" }, 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = sniffImageMime(buffer);
  if (!mime) return json({ ok: false, error: "unsupported_type" }, 415);

  try {
    const id = await insertMedia({
      data: buffer,
      mime,
      width: dimension(form.get("width")),
      height: dimension(form.get("height")),
      inGallery: form.get("gallery") !== "0", // logo/foto khusus diunggah dengan gallery=0
    });
    revalidatePath("/", "layout");
    return json({ ok: true, id });
  } catch (error) {
    logger.error("photo upload failed", { error });
    return json({ ok: false, error: "save_failed" }, 500);
  }
}
