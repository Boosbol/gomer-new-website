import "server-only";
import { z } from "zod";
import { site } from "../config/site";

/**
 * Validasi environment variable SERVER-SIDE. File ini memakai "server-only":
 * jika ada Client Component yang mengimpornya (langsung/tidak langsung), build gagal,
 * sehingga secret tidak mungkin masuk bundle browser.
 */
const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optional = <T extends z.ZodTypeAny>(inner: T) => z.preprocess(emptyToUndefined, inner.optional());

const schema = z.object({
  SPOTIFY_CLIENT_ID: optional(z.string().trim()),
  SPOTIFY_CLIENT_SECRET: optional(z.string().trim()),
  SPOTIFY_REFRESH_TOKEN: optional(z.string().trim()),
  YOUTUBE_CHANNEL_ID: optional(z.string().trim().regex(/^UC[\w-]{22}$/)),
  DATABASE_URL: optional(z.string().trim().regex(/^mysql:\/\//, "harus berawalan mysql://")),
  DATABASE_SSL: optional(z.enum(["true", "false"])),
  CRON_SECRET: optional(z.string().min(24)),
  ADMIN_USER: optional(z.string().trim()),
  ADMIN_PASSWORD: optional(z.string().min(12)),
  ENABLE_STALE_SYNC: optional(z.enum(["true", "false"])),
  MUSIC_SOURCE: optional(z.enum(["apple", "spotify"])),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Hanya nama variabel yang dilaporkan — tidak pernah nilainya.
    const names = [...new Set(parsed.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new Error(`Environment variable tidak valid: ${names}`);
  }
  cached = parsed.data;
  return cached;
}

export function isSpotifyConfigured(): boolean {
  try {
    const env = getEnv();
    return Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET);
  } catch {
    return false;
  }
}

/** Channel ID: env YOUTUBE_CHANNEL_ID menimpa nilai default di src/config/site.ts. Kosong = video nonaktif. */
export function getYouTubeChannelId(): string | undefined {
  try {
    return getEnv().YOUTUBE_CHANNEL_ID ?? (site.youtubeChannelId || undefined);
  } catch {
    return site.youtubeChannelId || undefined;
  }
}

export function isYouTubeConfigured(): boolean {
  return Boolean(getYouTubeChannelId());
}
