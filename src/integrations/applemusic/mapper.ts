import type { NormalizedRelease, NormalizedTrack, ReleaseType } from "../types";
import type { Collection, Song } from "./schemas";

const APPLE_HOSTS = new Set(["music.apple.com", "itunes.apple.com"]);

/**
 * Hanya menerima https ke domain Apple (URL ini dipakai sebagai href dan sumber iframe).
 * keepTrackParam=true mempertahankan ?i=<trackId> agar tautan menuju lagu, bukan hanya album.
 */
export function safeAppleUrl(raw: string, keepTrackParam = false): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || !APPLE_HOSTS.has(u.hostname)) return null;
    const track = keepTrackParam ? u.searchParams.get("i") : null;
    u.search = "";
    u.hash = "";
    if (track && /^\d+$/.test(track)) u.searchParams.set("i", track);
    return u.toString();
  } catch {
    return null;
  }
}

/** Apple memberi sampul 100x100; ukuran lain tersedia dengan mengganti bagian ukuran pada URL. */
export function upscaleArtwork(raw: string | undefined, size = 640): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || !u.hostname.endsWith(".mzstatic.com")) return null;
    return raw.replace(/\/\d+x\d+(bb|cc|sr)?\.(jpg|jpeg|png|webp)$/i, `/${size}x${size}bb.jpg`);
  } catch {
    return null;
  }
}

/**
 * Apple menamai rilisan "Judul - Single" / "Judul - EP". Akhiran dibuang dari judul dan dipakai
 * untuk menentukan tipe. Tipe bisa dikoreksi manual lewat release-overrides.
 */
export function parseCollectionTitle(name: string, collectionType?: string): { title: string; type: ReleaseType } {
  const trimmed = name.trim();
  const m = /^(.*?)\s+-\s+(Single|EP)$/i.exec(trimmed);
  if (m && m[1]) return { title: m[1].trim(), type: m[2]?.toLowerCase() === "ep" ? "ep" : "single" };
  if (collectionType && /compilation/i.test(collectionType)) return { title: trimmed, type: "compilation" };
  return { title: trimmed, type: "album" };
}

export function dedupeTracks(list: NormalizedTrack[]): NormalizedTrack[] {
  const seen = new Set<string>();
  return list.filter((t) => (seen.has(t.externalId) ? false : (seen.add(t.externalId), true)));
}

export function toNormalizedTrack(song: Song): NormalizedTrack {
  return {
    externalId: String(song.trackId),
    title: song.trackName,
    durationMs: song.trackTimeMillis ?? null,
    trackNumber: song.trackNumber ?? 1,
    discNumber: song.discNumber ?? 1,
    explicit: song.trackExplicitness === "explicit",
    externalUrl: song.trackViewUrl ? safeAppleUrl(song.trackViewUrl, true) : null,
  };
}

/** Mengembalikan null bila data penting tidak valid (rilisan dilewati, bukan mengarang data). */
export function toNormalizedRelease(c: Collection, tracks: NormalizedTrack[] | null): NormalizedRelease | null {
  const url = safeAppleUrl(c.collectionViewUrl);
  const date = c.releaseDate.slice(0, 10);
  if (!url || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const { title, type } = parseCollectionTitle(c.collectionName, c.collectionType);
  const genre = c.primaryGenreName && c.primaryGenreName !== "Music" ? [c.primaryGenreName] : [];
  return {
    platform: "appleMusic",
    externalId: String(c.collectionId),
    type,
    title,
    artist: c.artistName || "Artis tidak diketahui",
    album: title,
    artworkUrl: upscaleArtwork(c.artworkUrl100),
    releaseDate: date,
    releaseDatePrecision: "day",
    externalUrl: url,
    totalTracks: c.trackCount ?? null,
    genres: genre,
    tracks: tracks ? dedupeTracks(tracks) : null,
  };
}
