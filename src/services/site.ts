import "server-only";
import { cache } from "react";
import { getContent } from "@/services/content";
import { listMediaSafe } from "@/services/media";

/** Data yang dipakai header/footer/halaman sekaligus; di-cache selama satu request. */
export const getSiteData = cache(async () => {
  const [content, media] = await Promise.all([getContent(), listMediaSafe()]);
  return { content, media };
});
