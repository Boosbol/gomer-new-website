import "server-only";
import { site } from "@/config/site";
import { isSpotifyConfigured } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { FetchReleasesOptions, MusicProvider, NormalizedRelease, NormalizedTrack } from "../types";
import { spotifyGet } from "./client";
import { dedupeTracks, toNormalizedRelease, toNormalizedTrack } from "./mapper";
import {
  albumDetailSchema,
  albumPageSchema,
  albumSummarySchema,
  trackItemSchema,
  trackPageSchema,
  type AlbumSummary,
} from "./schemas";

const MAX_RELEASES = 100;
const DETAIL_CONCURRENCY = 3;

async function listArtistAlbums(artistId: string): Promise<AlbumSummary[]> {
  const found = new Map<string, AlbumSummary>();
  let next: string | null = null;
  let first = true;
  let invalid = 0;

  while ((first || next) && found.size < MAX_RELEASES) {
    const raw: unknown = first
      ? await spotifyGet(`/artists/${artistId}/albums`, { include_groups: "album,single,compilation", limit: 20 })
      : await spotifyGet(next as string);
    first = false;
    const page = albumPageSchema.parse(raw);
    for (const item of page.items) {
      const parsed = albumSummarySchema.safeParse(item);
      if (parsed.success) found.set(parsed.data.id, parsed.data);
      else invalid++;
    }
    next = page.next ?? null;
  }
  if (invalid > 0) logger.warn("spotify returned invalid album items; skipped", { invalid });
  return [...found.values()];
}

async function fetchAlbumDetail(album: AlbumSummary): Promise<NormalizedRelease> {
  const raw = await spotifyGet(`/albums/${album.id}`);
  const detail = albumDetailSchema.parse(raw);
  const trackItems: NormalizedTrack[] = [];
  let page = detail.tracks;
  for (;;) {
    for (const item of page.items) {
      const parsed = trackItemSchema.safeParse(item);
      if (parsed.success) trackItems.push(toNormalizedTrack(parsed.data, album.id));
    }
    if (!page.next) break;
    page = trackPageSchema.parse(await spotifyGet(page.next));
  }
  return toNormalizedRelease(detail, dedupeTracks(trackItems));
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index] as T);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Mengambil semua rilisan artis (album, single, EP, kompilasi) dari Spotify.
 * Tracklist hanya diambil untuk rilisan baru (hemat request & rate limit).
 */
export async function getLatestSpotifyReleases(options: FetchReleasesOptions = {}): Promise<NormalizedRelease[]> {
  const { skipDetailsFor = new Set<string>(), includeTracks = true } = options;
  const albums = await listArtistAlbums(site.spotifyArtistId);

  const needDetails = includeTracks ? albums.filter((a) => !skipDetailsFor.has(a.id)) : [];
  const detailed = new Map<string, NormalizedRelease>();
  let failures = 0;

  await mapWithConcurrency(needDetails, DETAIL_CONCURRENCY, async (album) => {
    try {
      detailed.set(album.id, await fetchAlbumDetail(album));
    } catch (error) {
      failures++;
      logger.warn("failed to fetch album detail; will retry next sync", { albumId: album.id, error });
    }
  });
  if (failures > 0) logger.warn("some album details failed", { failures, total: needDetails.length });

  return albums.map((album) => detailed.get(album.id) ?? toNormalizedRelease(album, null));
}

export const spotifyProvider: MusicProvider = {
  id: "spotify",
  isConfigured: isSpotifyConfigured,
  getLatestReleases: getLatestSpotifyReleases,
};
