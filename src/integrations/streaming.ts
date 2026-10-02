/**
 * Platform streaming yang dikenali UI. Tambah platform baru = tambah satu baris di sini,
 * lalu isi tautannya lewat provider baru (src/integrations/<platform>) atau release-overrides.
 */
export const streamingPlatforms = {
  spotify: "Spotify",
  appleMusic: "Apple Music",
  youtubeMusic: "YouTube Music",
  deezer: "Deezer",
  amazonMusic: "Amazon Music",
  bandcamp: "Bandcamp",
} as const;

export type StreamingPlatform = keyof typeof streamingPlatforms;

/** Nama tampilan untuk id platform (mis. "appleMusic" → "Apple Music"). */
export function platformLabel(platform: string): string {
  return platform in streamingPlatforms ? streamingPlatforms[platform as StreamingPlatform] : platform;
}
