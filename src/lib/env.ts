import "server-only";
import { z } from "zod";
import { site } from "../config/site";
import { cleanEnvValue, cleanUrlValue, isMysqlUrl, lowerEnvValue } from "./env-clean";

/**
 * Validasi environment variable SERVER-SIDE (server-only: build gagal bila ada Client Component yang
 * mengimpornya, sehingga secret tidak mungkin masuk bundle browser).
 *
 * Toleran: tiap variabel divalidasi sendiri-sendiri. Variabel yang bentuknya salah diabaikan (dianggap
 * kosong) dan dicatat di envProblems() — satu variabel salah TIDAK lagi mematikan fitur lain.
 * Kredensial admin & CRON_SECRET dibaca terpisah oleh src/lib/admin-env.ts.
 */
const text = <T extends z.ZodTypeAny>(inner: T) => z.preprocess(cleanEnvValue, inner.optional());
const flag = z.preprocess(lowerEnvValue, z.enum(["true", "false"]).optional());

const fields = {
  SPOTIFY_CLIENT_ID: text(z.string()),
  SPOTIFY_CLIENT_SECRET: text(z.string()),
  SPOTIFY_REFRESH_TOKEN: text(z.string()),
  YOUTUBE_CHANNEL_ID: text(z.string().regex(/^UC[\w-]{22}$/)),
  DATABASE_URL: z.preprocess(cleanUrlValue, z.string().refine(isMysqlUrl, "harus berawalan mysql://").optional()),
  DATABASE_SSL: flag,
  ENABLE_STALE_SYNC: flag,
  MUSIC_SOURCE: z.preprocess(lowerEnvValue, z.enum(["apple", "spotify"]).optional()),
} satisfies Record<string, z.ZodTypeAny>;

export type Env = { [K in keyof typeof fields]: z.infer<(typeof fields)[K]> };

let cached: { env: Env; problems: string[] } | null = null;

function load() {
  if (cached) return cached;
  const env: Record<string, unknown> = {};
  const problems: string[] = [];
  for (const [key, schema] of Object.entries(fields)) {
    const result = schema.safeParse(process.env[key]);
    if (result.success) env[key] = result.data;
    else problems.push(key); // hanya nama variabel — tidak pernah nilainya
  }
  cached = { env: env as Env, problems };
  return cached;
}

/** Tidak pernah melempar error. */
export function getEnv(): Env {
  return load().env;
}

/** Nama variabel yang nilainya tidak valid (diabaikan). */
export function envProblems(): string[] {
  return load().problems;
}

export function isSpotifyConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET);
}

/** Channel ID: env YOUTUBE_CHANNEL_ID menimpa nilai default di src/config/site.ts. Kosong = video nonaktif. */
export function getYouTubeChannelId(): string | undefined {
  return getEnv().YOUTUBE_CHANNEL_ID ?? (site.youtubeChannelId || undefined);
}

export function isYouTubeConfigured(): boolean {
  return Boolean(getYouTubeChannelId());
}
