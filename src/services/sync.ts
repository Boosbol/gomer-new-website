import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db";
import { releases, syncRuns, tracks, videos } from "@/lib/db/schema";
import { logger, scrub } from "@/lib/logger";
import { getMusicProviders, videoProviders } from "@/integrations/registry";
import { slugify, uniqueSlug } from "@/lib/slug";

export type SyncSource = "music" | "social";

export interface SyncOptions {
  /** true = abaikan cooldown (dipakai tombol "Sinkronkan sekarang" & ?force=1). */
  force?: boolean;
  minIntervalMs?: number;
}

export interface SyncOutcome {
  skipped: boolean;
  found: number;
  upserted: number;
}

export class SyncConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncConfigError";
  }
}

const DEFAULT_MIN_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Pembungkus umum: cooldown (mencegah request berlebihan ke API eksternal), pencatatan sync_runs,
 * logging, dan penanganan error. Revalidasi cache halaman dilakukan pemanggil (route/action),
 * bukan di sini, supaya service ini bisa dijalankan dari script CLI.
 */
async function runTracked(
  source: SyncSource,
  options: SyncOptions,
  work: (db: Db) => Promise<{ found: number; upserted: number }>,
): Promise<SyncOutcome> {
  const db = getDb();
  if (!db) throw new SyncConfigError("DATABASE_URL belum diatur");

  if (!options.force) {
    const [last] = await db
      .select({ startedAt: syncRuns.startedAt })
      .from(syncRuns)
      .where(eq(syncRuns.source, source))
      .orderBy(desc(syncRuns.startedAt))
      .limit(1);
    const minInterval = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
    if (last && Date.now() - last.startedAt.getTime() < minInterval) {
      logger.info("sync skipped (cooldown)", { source });
      return { skipped: true, found: 0, upserted: 0 };
    }
  }

  const [inserted] = await db.insert(syncRuns).values({ source, status: "running" });
  const run = { id: Number(inserted.insertId) };
  logger.info("sync started", { source });

  try {
    const result = await work(db);
    await db
      .update(syncRuns)
      .set({ status: "success", finishedAt: new Date(), itemsFound: result.found, itemsUpserted: result.upserted })
      .where(eq(syncRuns.id, run.id));
    logger.info("sync completed", { source, ...result });
    return { skipped: false, ...result };
  } catch (error) {
    const message = scrub(error instanceof Error ? error.message : "Kesalahan tidak diketahui").slice(0, 500);
    try {
      await db
        .update(syncRuns)
        .set({ status: "error", finishedAt: new Date(), errorMessage: message })
        .where(eq(syncRuns.id, run.id));
    } catch {
      /* jangan menutupi error asli */
    }
    logger.error("sync failed", { source, error });
    throw error;
  }
}

export function syncMusic(options: SyncOptions = {}): Promise<SyncOutcome> {
  return runTracked("music", options, async (db) => {
    let found = 0;
    let upserted = 0;

    for (const provider of getMusicProviders()) {
      if (!provider.isConfigured()) {
        logger.warn("music provider not configured; skipped", { provider: provider.id });
        continue;
      }

      const existing = await db
        .select({ id: releases.id, externalId: releases.externalId, slug: releases.slug, platform: releases.platform })
        .from(releases);
      const trackCounts = await db
        .select({ releaseId: tracks.releaseId, n: sql<number>`count(*)` })
        .from(tracks)
        .groupBy(tracks.releaseId);
      const withTracks = new Set(trackCounts.filter((t) => Number(t.n) > 0).map((t) => t.releaseId));

      const mine = existing.filter((r) => r.platform === provider.id);
      const skipDetailsFor = new Set(mine.filter((r) => withTracks.has(r.id)).map((r) => r.externalId));
      const slugByExternal = new Map(mine.map((r) => [r.externalId, r.slug]));
      const takenSlugs = new Set(existing.map((r) => r.slug));

      const fetched = await provider.getLatestReleases({ skipDetailsFor });
      logger.info("releases fetched", { provider: provider.id, count: fetched.length });
      found += fetched.length;

      for (const r of fetched) {
        let slug = slugByExternal.get(r.externalId);
        if (!slug) {
          slug = uniqueSlug(slugify(r.title), takenSlugs, [r.releaseDate.slice(0, 4), r.externalId.slice(0, 6).toLowerCase()]);
          takenSlugs.add(slug);
        }
        const now = new Date();
        const values = {
          platform: r.platform,
          externalId: r.externalId,
          slug,
          type: r.type,
          title: r.title,
          artist: r.artist,
          album: r.album,
          artworkUrl: r.artworkUrl,
          releaseDate: r.releaseDate,
          releaseDatePrecision: r.releaseDatePrecision,
          externalUrl: r.externalUrl,
          genres: r.genres,
          totalTracks: r.totalTracks,
          fetchedAt: now,
        };

        // Upsert berdasarkan (platform, external_id): sync berulang tidak membuat duplikat,
        // dan slug/deskripsi yang sudah ada tidak ditimpa. (MySQL: INSERT ... ON DUPLICATE KEY UPDATE)
        await db
          .insert(releases)
          .values(values)
          .onDuplicateKeyUpdate({
            set: {
              type: values.type,
              title: values.title,
              artist: values.artist,
              album: values.album,
              artworkUrl: values.artworkUrl,
              releaseDate: values.releaseDate,
              releaseDatePrecision: values.releaseDatePrecision,
              externalUrl: values.externalUrl,
              genres: values.genres,
              totalTracks: values.totalTracks,
              fetchedAt: now,
              updatedAt: now,
            },
          });
        // MySQL tidak punya RETURNING → ambil id baris (baru atau lama) lewat kunci uniknya.
        const [row] = await db
          .select({ id: releases.id })
          .from(releases)
          .where(and(eq(releases.platform, r.platform), eq(releases.externalId, r.externalId)))
          .limit(1);
        if (!row) continue;

        if (r.tracks && r.tracks.length > 0) {
          await db
            .insert(tracks)
            .values(
              r.tracks.map((t) => ({
                releaseId: row.id,
                externalId: t.externalId,
                title: t.title,
                durationMs: t.durationMs,
                trackNumber: t.trackNumber,
                discNumber: t.discNumber,
                explicit: t.explicit,
                externalUrl: t.externalUrl,
              })),
            )
            .onDuplicateKeyUpdate({
              set: {
                title: sql`values(title)`,
                durationMs: sql`values(duration_ms)`,
                trackNumber: sql`values(track_number)`,
                discNumber: sql`values(disc_number)`,
                explicit: sql`values(explicit)`,
                externalUrl: sql`values(external_url)`,
              },
            });
        }
        upserted++;
      }
      logger.info("database update", { provider: provider.id, upserted });
    }
    return { found, upserted };
  });
}

export function syncVideos(options: SyncOptions = {}): Promise<SyncOutcome> {
  return runTracked("social", options, async (db) => {
    let found = 0;
    let upserted = 0;

    for (const provider of videoProviders) {
      if (!provider.isConfigured()) {
        logger.warn("video provider not configured; skipped", { provider: provider.id });
        continue;
      }
      const fetched = await provider.getLatestVideos(12);
      found += fetched.length;
      for (const v of fetched) {
        const now = new Date();
        await db
          .insert(videos)
          .values({
            platform: v.platform,
            externalId: v.externalId,
            title: v.title,
            description: v.description,
            thumbnailUrl: v.thumbnailUrl,
            url: v.url,
            publishedAt: v.publishedAt,
            fetchedAt: now,
          })
          .onDuplicateKeyUpdate({
            set: { title: v.title, description: v.description, thumbnailUrl: v.thumbnailUrl, url: v.url, publishedAt: v.publishedAt, fetchedAt: now },
          });
        upserted++;
      }
      logger.info("database update", { provider: provider.id, upserted });
    }
    return { found, upserted };
  });
}

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Fallback tanpa cron (ENABLE_STALE_SYNC=true): dipanggil setelah render halaman.
 * Hanya berjalan bila data lebih tua dari 24 jam DAN cooldown 1 jam sudah lewat.
 */
export async function triggerStaleSync(newestFetchedAt: string | null): Promise<void> {
  if (process.env.ENABLE_STALE_SYNC !== "true") return;
  const age = newestFetchedAt ? Date.now() - new Date(newestFetchedAt).getTime() : Number.POSITIVE_INFINITY;
  if (age < STALE_AFTER_MS) return;
  try {
    await syncMusic({ minIntervalMs: 60 * 60 * 1000 });
  } catch {
    /* sudah dicatat oleh runTracked */
  }
}

export interface RunRow {
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  itemsFound: number;
  itemsUpserted: number;
  errorMessage: string | null;
}

export interface SyncStatus {
  database: boolean;
  releaseCount: number;
  videoCount: number;
  sources: Record<SyncSource, { lastRun: RunRow | null; lastSuccess: RunRow | null }>;
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const empty = { lastRun: null, lastSuccess: null };
  const db = getDb();
  if (!db) return { database: false, releaseCount: 0, videoCount: 0, sources: { music: empty, social: empty } };

  const cols = {
    status: syncRuns.status,
    startedAt: syncRuns.startedAt,
    finishedAt: syncRuns.finishedAt,
    itemsFound: syncRuns.itemsFound,
    itemsUpserted: syncRuns.itemsUpserted,
    errorMessage: syncRuns.errorMessage,
  };
  const forSource = async (source: SyncSource) => {
    const [lastRun] = await db.select(cols).from(syncRuns).where(eq(syncRuns.source, source)).orderBy(desc(syncRuns.startedAt)).limit(1);
    const [lastSuccess] = await db
      .select(cols)
      .from(syncRuns)
      .where(and(eq(syncRuns.source, source), eq(syncRuns.status, "success")))
      .orderBy(desc(syncRuns.startedAt))
      .limit(1);
    return { lastRun: lastRun ?? null, lastSuccess: lastSuccess ?? null };
  };

  const [music, social] = await Promise.all([forSource("music"), forSource("social")]);
  const [releaseRow] = await db.select({ n: sql<number>`count(*)` }).from(releases);
  const [videoRow] = await db.select({ n: sql<number>`count(*)` }).from(videos);
  return {
    database: true,
    releaseCount: Number(releaseRow?.n ?? 0),
    videoCount: Number(videoRow?.n ?? 0),
    sources: { music, social },
  };
}
