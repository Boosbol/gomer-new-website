import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { gallerySections, media } from "@/lib/db/schema";
import { groupGallery, type GalleryGroup, type SectionInfo } from "@/lib/gallery-group";
import { logger } from "@/lib/logger";
import { listMediaSafe, type MediaMeta } from "@/services/media";

const toInfo = (r: typeof gallerySections.$inferSelect): SectionInfo => ({
  id: r.id,
  title: r.title,
  subtitle: r.subtitle,
  layout: r.layout === "masonry" ? "masonry" : "rows",
  sortOrder: r.sortOrder,
});

export async function listSections(): Promise<SectionInfo[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(gallerySections).orderBy(asc(gallerySections.sortOrder), asc(gallerySections.createdAt));
  return rows.map(toInfo);
}

/** Untuk halaman publik: tidak pernah melempar error. */
export async function loadGallery(): Promise<GalleryGroup<MediaMeta>[]> {
  try {
    const [sections, photos] = await Promise.all([listSections(), listMediaSafe()]);
    return groupGallery(sections, photos);
  } catch (error) {
    logger.warn("gallery read failed", { error });
    return [];
  }
}

export async function createSection(input: { title: string; subtitle: string | null; layout: "rows" | "masonry"; sortOrder: number }) {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL belum diatur");
  await db.insert(gallerySections).values(input);
}

export async function updateSection(
  id: string,
  input: { title: string; subtitle: string | null; layout: "rows" | "masonry"; sortOrder: number },
) {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL belum diatur");
  await db.update(gallerySections).set(input).where(eq(gallerySections.id, id));
}

/** Foto dalam bagian yang dihapus tidak ikut terhapus; mereka pindah ke "tanpa bagian". */
export async function deleteSection(id: string) {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL belum diatur");
  await db.update(media).set({ sectionId: null }).where(eq(media.sectionId, id));
  await db.delete(gallerySections).where(eq(gallerySections.id, id));
}
