import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { fetchWithTimeout } from "@/lib/http";
import { logger } from "@/lib/logger";
import { parseYouTubeId } from "@/lib/youtube-url";

export interface VideoView {
  id: string;
  externalId: string;
  title: string;
  thumbnailUrl: string | null;
  url: string;
  publishedAt: string;
  source: string;
  hidden: boolean;
}

type Row = typeof videos.$inferSelect;
const toView = (v: Row): VideoView => ({
  id: v.id,
  externalId: v.externalId,
  title: v.title,
  thumbnailUrl: v.thumbnailUrl,
  url: v.url,
  publishedAt: v.publishedAt.toISOString(),
  source: v.source,
  hidden: v.hidden,
});

/** Video publik (yang tidak disembunyikan). Jika DB belum ada/gagal → [] dan section disembunyikan. */
export async function loadVideos(limit = 6): Promise<VideoView[]> {
  try {
    const db = getDb();
    if (!db) return [];
    const rows = await db.select().from(videos).where(eq(videos.hidden, false)).orderBy(desc(videos.publishedAt)).limit(limit);
    return rows.map(toView);
  } catch (error) {
    logger.warn("video read failed", { error });
    return [];
  }
}

export async function listAllVideos(): Promise<VideoView[]> {
  const db = getDb();
  if (!db) return [];
  return (await db.select().from(videos).orderBy(desc(videos.publishedAt))).map(toView);
}

async function fetchOEmbedTitle(videoId: string): Promise<string | null> {
  try {
    const target = new URL("https://www.youtube.com/oembed");
    target.searchParams.set("url", `https://www.youtube.com/watch?v=${videoId}`);
    target.searchParams.set("format", "json");
    const res = await fetchWithTimeout(target, { cache: "no-store" }, 6_000);
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: unknown };
    return typeof data.title === "string" && data.title.trim() ? data.title.trim().slice(0, 400) : null;
  } catch {
    return null;
  }
}

export type AddVideoResult = { ok: true } | { ok: false; error: "invalid_url" | "no_database" };

/** Menambah video YouTube dari tautan. Judul diambil otomatis (oEmbed publik) bila tidak diisi. */
export async function addManualVideo(input: { url: string; title?: string; publishedAt?: Date }): Promise<AddVideoResult> {
  const id = parseYouTubeId(input.url);
  if (!id) return { ok: false, error: "invalid_url" };
  const db = getDb();
  if (!db) return { ok: false, error: "no_database" };

  const title = input.title?.trim() || (await fetchOEmbedTitle(id)) || "Video";
  const now = new Date();
  const publishedAt = input.publishedAt ?? now;
  await db
    .insert(videos)
    .values({
      platform: "youtube",
      externalId: id,
      title: title.slice(0, 500),
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${id}`,
      publishedAt,
      fetchedAt: now,
      source: "manual",
      hidden: false,
    })
    // Jika video sudah ada (mis. dari sinkron otomatis), cukup tampilkan kembali.
    .onDuplicateKeyUpdate({ set: { hidden: false } });
  return { ok: true };
}

export async function setVideoHidden(id: string, hidden: boolean): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL belum diatur");
  await db.update(videos).set({ hidden }).where(eq(videos.id, id));
}

/** Hanya video manual yang boleh dihapus; video otomatis cukup disembunyikan (kalau dihapus akan muncul lagi saat sinkron). */
export async function deleteManualVideo(id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL belum diatur");
  await db.delete(videos).where(and(eq(videos.id, id), eq(videos.source, "manual")));
}
