import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import fallbackData from "@/data/releases.fallback.json";
import { releaseOverrides } from "@/config/release-overrides";
import { getDb } from "@/lib/db";
import { releases, tracks } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { slugify, uniqueSlug } from "@/lib/slug";
import { getMusicProviders } from "@/integrations/registry";
import type { StreamingPlatform } from "@/integrations/streaming";
import type { DatePrecision, NormalizedRelease, ReleaseType } from "@/integrations/types";

export interface ReleaseView {
  id: string;
  slug: string;
  platform: string;
  externalId: string;
  type: ReleaseType;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  releaseDate: string;
  releaseDatePrecision: DatePrecision;
  description: string | null;
  externalUrl: string;
  embedUrl: string | null;
  embedHeight: number | null;
  links: Partial<Record<StreamingPlatform, string>>;
  genres: string[];
  totalTracks: number | null;
  fetchedAt: string | null;
}

export interface TrackView {
  id: string;
  title: string;
  durationMs: number | null;
  trackNumber: number;
  discNumber: number;
  explicit: boolean;
  externalUrl: string | null;
}

export type ReleaseDetail = ReleaseView & { tracks: TrackView[] };
export type ReleaseSource = "database" | "live" | "fallback";
export interface LoadedReleases {
  items: ReleaseView[];
  source: ReleaseSource;
  newestFetchedAt: string | null;
}

type BaseView = Omit<ReleaseView, "embedUrl" | "embedHeight" | "links">;

function buildView(base: BaseView): ReleaseView | null {
  const override = releaseOverrides[base.externalId];
  if (override?.hidden) return null;
  const type = override?.type ?? base.type;
  const isSingle = type === "single";
  let embedUrl: string | null = null;
  let embedHeight: number | null = null;
  if (base.platform === "spotify" && /^[A-Za-z0-9]{10,30}$/.test(base.externalId)) {
    embedUrl = `https://open.spotify.com/embed/album/${base.externalId}?utm_source=generator&theme=0`;
    embedHeight = isSingle ? 152 : 352;
  } else if (base.platform === "appleMusic") {
    try {
      // Pemutar Apple: ganti host music.apple.com → embed.music.apple.com pada URL rilisan.
      const u = new URL(base.externalUrl);
      if (u.hostname === "music.apple.com") {
        u.hostname = "embed.music.apple.com";
        embedUrl = u.toString();
        embedHeight = isSingle ? 175 : 450;
      }
    } catch {
      /* URL tidak valid → tanpa pemutar */
    }
  }
  const links: Partial<Record<StreamingPlatform, string>> = {};
  if (base.platform === "spotify" || base.platform === "appleMusic") links[base.platform] = base.externalUrl;
  Object.assign(links, override?.links ?? {});
  return {
    ...base,
    type,
    description: override?.description ?? base.description,
    embedUrl,
    embedHeight,
    links,
  };
}

function fromRow(row: typeof releases.$inferSelect): ReleaseView | null {
  return buildView({
    id: row.id,
    slug: row.slug,
    platform: row.platform,
    externalId: row.externalId,
    type: row.type as ReleaseType,
    title: row.title,
    artist: row.artist,
    album: row.album,
    artworkUrl: row.artworkUrl,
    releaseDate: row.releaseDate,
    releaseDatePrecision: row.releaseDatePrecision as DatePrecision,
    description: row.description,
    externalUrl: row.externalUrl,
    genres: row.genres,
    totalTracks: row.totalTracks,
    fetchedAt: row.fetchedAt.toISOString(),
  });
}

function compact(list: (ReleaseView | null)[]): ReleaseView[] {
  return list.filter((r): r is ReleaseView => r !== null);
}

// ─── Fallback lapis 2: Spotify langsung dengan cache TTL di memori server ─────────────
const LIVE_TTL_MS = 6 * 60 * 60 * 1000;
const LIVE_FAILURE_BACKOFF_MS = 5 * 60 * 1000;
let live: { at: number; items: ReleaseView[] } | null = null;
let liveFailedAt = 0;

function fromNormalized(list: NormalizedRelease[]): ReleaseView[] {
  const taken = new Set<string>();
  const views = list.map((r) => {
    const slug = uniqueSlug(slugify(r.title), taken, [r.releaseDate.slice(0, 4), r.externalId.slice(0, 6).toLowerCase()]);
    taken.add(slug);
    return buildView({
      id: `${r.platform}:${r.externalId}`,
      slug,
      platform: r.platform,
      externalId: r.externalId,
      type: r.type,
      title: r.title,
      artist: r.artist,
      album: r.album,
      artworkUrl: r.artworkUrl,
      releaseDate: r.releaseDate,
      releaseDatePrecision: r.releaseDatePrecision,
      description: null,
      externalUrl: r.externalUrl,
      genres: r.genres,
      totalTracks: r.totalTracks,
      fetchedAt: null,
    });
  });
  return compact(views);
}

async function loadLive(): Promise<ReleaseView[]> {
  const provider = getMusicProviders().find((p) => p.isConfigured());
  if (!provider) return [];
  if (live && Date.now() - live.at < LIVE_TTL_MS) return live.items;
  if (Date.now() - liveFailedAt < LIVE_FAILURE_BACKOFF_MS) return live?.items ?? [];
  try {
    const items = fromNormalized(await provider.getLatestReleases({ includeTracks: false }));
    items.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
    live = { at: Date.now(), items };
    return items;
  } catch (error) {
    liveFailedAt = Date.now();
    logger.warn("live music fallback failed", { error });
    return live?.items ?? [];
  }
}

// ─── Fallback lapis 3: data statis terakhir (src/data/releases.fallback.json) ────────
function loadStatic(): ReleaseView[] {
  const list = fallbackData as unknown as BaseView[];
  return compact(list.map((r) => buildView({ ...r })));
}

/** Urutan sumber: database → Spotify live (TTL) → data statis. Tidak pernah melempar error. */
export async function loadReleases(): Promise<LoadedReleases> {
  try {
    const db = getDb();
    if (db) {
      const activePlatform = getMusicProviders()[0]?.id ?? "appleMusic";
      const rows = await db
        .select()
        .from(releases)
        .where(eq(releases.platform, activePlatform))
        .orderBy(desc(releases.releaseDate), desc(releases.createdAt));
      if (rows.length > 0) {
        const items = compact(rows.map(fromRow));
        const newest = rows.reduce((max, r) => (r.fetchedAt > max ? r.fetchedAt : max), rows[0]!.fetchedAt);
        return { items, source: "database", newestFetchedAt: newest.toISOString() };
      }
    }
  } catch (error) {
    logger.warn("database read failed; using fallback", { error });
  }

  try {
    const items = await loadLive();
    if (items.length > 0) return { items, source: "live", newestFetchedAt: null };
  } catch (error) {
    logger.warn("live fallback failed", { error });
  }

  return { items: loadStatic(), source: "fallback", newestFetchedAt: null };
}

export async function getLatestReleases(limit = 1): Promise<ReleaseView[]> {
  const { items } = await loadReleases();
  return items.slice(0, Math.max(1, limit));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Menerima slug atau UUID. Tracklist hanya tersedia dari database. */
export async function getRelease(idOrSlug: string): Promise<ReleaseDetail | null> {
  try {
    const db = getDb();
    if (db) {
      const [row] = await db
        .select()
        .from(releases)
        .where(UUID.test(idOrSlug) ? eq(releases.id, idOrSlug) : eq(releases.slug, idOrSlug))
        .limit(1);
      if (row) {
        const view = fromRow(row);
        if (!view) return null;
        const trackRows = await db
          .select()
          .from(tracks)
          .where(eq(tracks.releaseId, row.id))
          .orderBy(asc(tracks.discNumber), asc(tracks.trackNumber));
        return {
          ...view,
          tracks: trackRows.map((t) => ({
            id: t.id,
            title: t.title,
            durationMs: t.durationMs,
            trackNumber: t.trackNumber,
            discNumber: t.discNumber,
            explicit: t.explicit,
            externalUrl: t.externalUrl,
          })),
        };
      }
    }
  } catch (error) {
    logger.warn("database read failed for release; using fallback", { error });
  }

  const { items } = await loadReleases();
  const match = items.find((r) => r.slug === idOrSlug || r.id === idOrSlug);
  return match ? { ...match, tracks: [] } : null;
}
