import type { DatePrecision, NormalizedRelease, NormalizedTrack, ReleaseType } from "../types";
import type { AlbumSummary, TrackItem } from "./schemas";

/** "2026" → "2026-01-01", "2026-03" → "2026-03-01". Presisi asli disimpan terpisah. */
export function normalizeDate(date: string, precision: DatePrecision): string {
  if (precision === "year") return `${date.slice(0, 4)}-01-01`;
  if (precision === "month") return `${date.slice(0, 7)}-01`;
  return date.slice(0, 10);
}

/**
 * Spotify hanya mengenal album_type: album | single | compilation; EP muncul sebagai "single".
 * Heuristik: "single" dengan ≥4 lagu dianggap EP. Bisa dikoreksi manual via release-overrides.
 */
export function classifyType(albumType: string, totalTracks: number): ReleaseType {
  if (albumType === "compilation") return "compilation";
  if (albumType === "single") return totalTracks >= 4 ? "ep" : "single";
  return "album";
}

/** Pilih gambar terbesar (Spotify biasanya 640, 300, 64). */
export function pickArtwork(images: { url: string; width?: number | null }[]): string | null {
  if (images.length === 0) return null;
  const sorted = [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return sorted[0]?.url ?? null;
}

export function toNormalizedTrack(item: TrackItem, albumId: string): NormalizedTrack {
  return {
    externalId: item.id ?? `${albumId}:${item.disc_number}:${item.track_number}`,
    title: item.name,
    durationMs: item.duration_ms ?? null,
    trackNumber: item.track_number,
    discNumber: item.disc_number,
    explicit: item.explicit,
    externalUrl: item.external_urls.spotify ?? null,
  };
}

/** Menghapus duplikat externalId (mencegah error "ON CONFLICT ... second time" saat upsert massal). */
export function dedupeTracks(list: NormalizedTrack[]): NormalizedTrack[] {
  const seen = new Set<string>();
  return list.filter((t) => (seen.has(t.externalId) ? false : (seen.add(t.externalId), true)));
}

export function toNormalizedRelease(
  album: AlbumSummary & { genres?: string[] },
  tracks: NormalizedTrack[] | null,
): NormalizedRelease {
  const artist = album.artists.map((a) => a.name).join(", ");
  return {
    platform: "spotify",
    externalId: album.id,
    type: classifyType(album.album_type, album.total_tracks),
    title: album.name,
    artist: artist || "Artis tidak diketahui",
    album: album.name,
    artworkUrl: pickArtwork(album.images),
    releaseDate: normalizeDate(album.release_date, album.release_date_precision),
    releaseDatePrecision: album.release_date_precision,
    externalUrl: album.external_urls.spotify,
    totalTracks: album.total_tracks,
    genres: album.genres ?? [],
    tracks: tracks ? dedupeTracks(tracks) : null,
  };
}
