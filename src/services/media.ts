import "server-only";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export interface MediaMeta {
  id: string;
  mime: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  caption: string | null;
  inGallery: boolean;
  sectionId: string | null;
  createdAt: Date;
}

// Kolom TANPA `data` (blob) agar daftar foto ringan.
const metaColumns = {
  id: media.id,
  mime: media.mime,
  sizeBytes: media.sizeBytes,
  width: media.width,
  height: media.height,
  caption: media.caption,
  inGallery: media.inGallery,
  sectionId: media.sectionId,
  createdAt: media.createdAt,
};

export const MAX_MEDIA_COUNT = 300;

/** Untuk halaman publik: aman terhadap kegagalan database. */
export async function listMediaSafe(): Promise<MediaMeta[]> {
  try {
    const db = getDb();
    if (!db) return [];
    return await db.select(metaColumns).from(media).orderBy(desc(media.createdAt));
  } catch (error) {
    logger.warn("media list failed", { error });
    return [];
  }
}

export async function listMedia(): Promise<MediaMeta[]> {
  const db = getDb();
  if (!db) return [];
  return db.select(metaColumns).from(media).orderBy(desc(media.createdAt));
}

export async function insertMedia(input: {
  data: Buffer;
  mime: string;
  width: number | null;
  height: number | null;
  inGallery?: boolean;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL belum diatur");
  const existing = await db.select({ id: media.id }).from(media);
  if (existing.length >= MAX_MEDIA_COUNT) throw new Error("Batas jumlah foto tercapai");
  const id = randomUUID();
  await db.insert(media).values({
    id,
    mime: input.mime,
    sizeBytes: input.data.length,
    width: input.width,
    height: input.height,
    inGallery: input.inGallery ?? true,
    data: input.data,
  });
  return id;
}

export async function updateMedia(
  id: string,
  patch: { caption: string | null; inGallery: boolean; sectionId: string | null },
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL belum diatur");
  await db.update(media).set(patch).where(eq(media.id, id));
}

export async function deleteMedia(id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL belum diatur");
  await db.delete(media).where(eq(media.id, id));
}

export async function getMediaData(id: string): Promise<{ mime: string; data: Buffer } | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select({ mime: media.mime, data: media.data }).from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}
