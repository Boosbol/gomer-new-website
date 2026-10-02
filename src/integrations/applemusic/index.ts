import "server-only";
import { site } from "@/config/site";
import { fetchWithTimeout, sleep } from "@/lib/http";
import { logger } from "@/lib/logger";
import type { FetchReleasesOptions, MusicProvider, NormalizedRelease, NormalizedTrack } from "../types";
import { toNormalizedRelease, toNormalizedTrack } from "./mapper";
import { collectionSchema, lookupSchema, songSchema, type Collection } from "./schemas";

const LOOKUP_URL = "https://itunes.apple.com/lookup";
const TIMEOUT_MS = 10_000;
const MAX_RELEASES = 100;
const DETAIL_CONCURRENCY = 2; // iTunes API membatasi laju permintaan — jaga tetap rendah

/** Dapat diubah di tes agar tidak menunggu lama. */
export const retryConfig = { baseMs: 1500, maxRetries: 2 };

export class AppleMusicApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "AppleMusicApiError";
  }
}

/** GET ke iTunes Lookup API (gratis, tanpa kunci) dengan timeout dan retry terbatas. */
async function lookup(params: Record<string, string | number>): Promise<unknown[]> {
  const url = new URL(LOOKUP_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  url.searchParams.set("country", site.appleMusicCountry);

  let attempt = 0;
  for (;;) {
    let res: Response;
    try {
      res = await fetchWithTimeout(url, { headers: { Accept: "application/json" }, cache: "no-store" }, TIMEOUT_MS);
    } catch {
      if (attempt < retryConfig.maxRetries) {
        await sleep(retryConfig.baseMs * 2 ** attempt++);
        continue;
      }
      throw new AppleMusicApiError("Permintaan ke Apple Music gagal atau timeout", 0);
    }

    if (res.ok) {
      const body = lookupSchema.parse(JSON.parse(await res.text()));
      return body.results;
    }

    // iTunes memakai 403/429 untuk pembatasan laju dan 5xx untuk gangguan sementara.
    const transient = res.status === 403 || res.status === 429 || res.status >= 500;
    if (transient && attempt < retryConfig.maxRetries) {
      logger.warn("apple music request throttled/unavailable; retrying", { status: res.status, attempt });
      await sleep(retryConfig.baseMs * 2 ** attempt++);
      continue;
    }
    throw new AppleMusicApiError(`Apple Music API merespons HTTP ${res.status}`, res.status);
  }
}

async function listAlbums(artistId: string): Promise<Collection[]> {
  const results = await lookup({ id: artistId, entity: "album", limit: 200 });
  const found = new Map<number, Collection>();
  let invalid = 0;
  for (const raw of results) {
    if ((raw as { wrapperType?: unknown } | null)?.wrapperType !== "collection") continue; // baris artis dilewati
    const parsed = collectionSchema.safeParse(raw);
    if (parsed.success) found.set(parsed.data.collectionId, parsed.data);
    else invalid++;
    if (found.size >= MAX_RELEASES) break;
  }
  if (invalid > 0) logger.warn("apple music returned invalid album items; skipped", { invalid });
  return [...found.values()];
}

async function fetchTracks(collection: Collection): Promise<NormalizedTrack[]> {
  const results = await lookup({ id: collection.collectionId, entity: "song", limit: 200 });
  const tracks: NormalizedTrack[] = [];
  for (const raw of results) {
    if ((raw as { wrapperType?: unknown } | null)?.wrapperType !== "track") continue;
    const parsed = songSchema.safeParse(raw);
    if (parsed.success) tracks.push(toNormalizedTrack(parsed.data));
  }
  return tracks;
}

async function mapWithConcurrency<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) await fn(items[cursor++] as T);
  });
  await Promise.all(workers);
}

/**
 * Mengambil semua rilisan artis dari Apple Music. Tracklist hanya diambil untuk rilisan baru
 * (hemat permintaan); kegagalan satu album tidak menggagalkan seluruh sinkronisasi.
 */
export async function getLatestAppleMusicReleases(options: FetchReleasesOptions = {}): Promise<NormalizedRelease[]> {
  const { skipDetailsFor = new Set<string>(), includeTracks = true } = options;
  const albums = await listAlbums(site.appleMusicArtistId);

  const needTracks = includeTracks ? albums.filter((a) => !skipDetailsFor.has(String(a.collectionId))) : [];
  const trackMap = new Map<number, NormalizedTrack[]>();
  let failures = 0;

  await mapWithConcurrency(needTracks, DETAIL_CONCURRENCY, async (album) => {
    try {
      trackMap.set(album.collectionId, await fetchTracks(album));
    } catch (error) {
      failures++;
      logger.warn("failed to fetch album tracks; will retry next sync", { collectionId: album.collectionId, error });
    }
  });
  if (failures > 0) logger.warn("some album track lists failed", { failures, total: needTracks.length });

  const releases: NormalizedRelease[] = [];
  for (const album of albums) {
    const release = toNormalizedRelease(album, trackMap.get(album.collectionId) ?? null);
    if (release) releases.push(release);
  }
  return releases;
}

export const appleMusicProvider: MusicProvider = {
  id: "appleMusic",
  isConfigured: () => Boolean(site.appleMusicArtistId), // tanpa kunci: cukup ID artis
  getLatestReleases: getLatestAppleMusicReleases,
};
