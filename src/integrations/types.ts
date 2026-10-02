/** Kontrak yang harus dipenuhi setiap integrasi. Website hanya bergantung pada tipe ini. */

export type ReleaseType = "album" | "single" | "ep" | "compilation";
export type DatePrecision = "year" | "month" | "day";

export interface NormalizedTrack {
  externalId: string;
  title: string;
  durationMs: number | null;
  trackNumber: number;
  discNumber: number;
  explicit: boolean;
  externalUrl: string | null;
}

export interface NormalizedRelease {
  platform: string; // "spotify", "appleMusic", ...
  externalId: string;
  type: ReleaseType;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  releaseDate: string; // ISO "YYYY-MM-DD" (dinormalisasi)
  releaseDatePrecision: DatePrecision;
  externalUrl: string;
  totalTracks: number | null;
  genres: string[];
  /** null = "tidak diambil / tidak berubah" (jangan menimpa tracklist yang sudah tersimpan). */
  tracks: NormalizedTrack[] | null;
}

export interface FetchReleasesOptions {
  /** externalId yang sudah lengkap di database; detail/tracklist-nya tidak diambil ulang. */
  skipDetailsFor?: ReadonlySet<string>;
  /** false = hanya daftar rilisan (hemat request), tanpa tracklist. */
  includeTracks?: boolean;
}

export interface MusicProvider {
  id: string;
  isConfigured(): boolean;
  getLatestReleases(options?: FetchReleasesOptions): Promise<NormalizedRelease[]>;
}

export interface NormalizedVideo {
  platform: string;
  externalId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date;
  url: string;
}

export interface VideoProvider {
  id: string;
  isConfigured(): boolean;
  getLatestVideos(limit?: number): Promise<NormalizedVideo[]>;
}

export interface SocialPost {
  platform: string;
  externalId: string;
  caption: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string;
  publishedAt: Date;
}

export interface SocialProvider {
  id: string;
  isConfigured(): boolean;
  getLatestPosts(limit?: number): Promise<SocialPost[]>;
}
