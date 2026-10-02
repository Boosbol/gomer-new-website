import "server-only";
import { getEnv } from "@/lib/env";
import { appleMusicProvider } from "./applemusic";
import { facebookProvider } from "./facebook";
import { instagramProvider } from "./instagram";
import { spotifyProvider } from "./spotify";
import { tiktokProvider } from "./tiktok";
import type { MusicProvider, SocialProvider, VideoProvider } from "./types";
import { youtubeProvider } from "./youtube";

/**
 * Sumber musik AKTIF — satu saja, agar rilisan yang sama tidak tampil ganda:
 *   MUSIC_SOURCE kosong / "apple"  → Apple Music (tanpa kunci)   ← default
 *   MUSIC_SOURCE="spotify"         → Spotify (butuh kunci + Premium)
 * Menambah platform baru (Deezer, Bandcamp, …): buat folder src/integrations/<nama> yang
 * mengekspor MusicProvider, lalu tambahkan pilihannya di sini dan di MUSIC_SOURCE (env.ts).
 */
export function getMusicProviders(): MusicProvider[] {
  let source: string | undefined;
  try {
    source = getEnv().MUSIC_SOURCE;
  } catch {
    /* env tidak valid → pakai default */
  }
  return [source === "spotify" ? spotifyProvider : appleMusicProvider];
}

export const videoProviders: VideoProvider[] = [youtubeProvider];
export const socialProviders: SocialProvider[] = [instagramProvider, tiktokProvider, facebookProvider];
