import "server-only";
import { eq } from "drizzle-orm";
import { defaultContent, parseStoredContent, type Content } from "@/lib/content-schema";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

const KEY = "content";

/** Tidak pernah melempar error: jika database tidak tersedia, situs memakai nilai default. */
export async function getContent(): Promise<Content> {
  try {
    const db = getDb();
    if (!db) return defaultContent();
    const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.name, KEY)).limit(1);
    return parseStoredContent(row?.value);
  } catch (error) {
    logger.warn("content read failed; using defaults", { error });
    return defaultContent();
  }
}

export async function saveContent(content: Content): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL belum diatur");
  const value = JSON.stringify(content);
  await db
    .insert(settings)
    .values({ name: KEY, value })
    .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
}
