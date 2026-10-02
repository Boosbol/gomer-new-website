import "server-only";
import { getEnv } from "@/lib/env";
import { fetchWithTimeout } from "@/lib/http";
import { logger } from "@/lib/logger";
import { SpotifyAuthError, SpotifyConfigError } from "./errors";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const EXPIRY_SKEW_MS = 60_000; // perbarui 1 menit sebelum kedaluwarsa

let cached: { token: string; expiresAt: number } | null = null;
let inflight: Promise<string> | null = null;

export function invalidateSpotifyToken() {
  cached = null;
}

/**
 * Access token disimpan di memori server dan dipakai ulang sampai hampir kedaluwarsa.
 * Token hanya diminta saat sync/fallback live — bukan pada setiap page load.
 * Jika SPOTIFY_REFRESH_TOKEN diisi → refresh_token flow; jika tidak → client_credentials.
 */
export async function getSpotifyAccessToken(): Promise<string> {
  if (cached && cached.expiresAt - EXPIRY_SKEW_MS > Date.now()) return cached.token;
  if (inflight) return inflight; // gabungkan permintaan bersamaan
  inflight = requestToken().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function requestToken(): Promise<string> {
  const env = getEnv();
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) throw new SpotifyConfigError();

  const useRefresh = Boolean(env.SPOTIFY_REFRESH_TOKEN);
  const body = new URLSearchParams(
    useRefresh
      ? { grant_type: "refresh_token", refresh_token: env.SPOTIFY_REFRESH_TOKEN as string }
      : { grant_type: "client_credentials" },
  );
  const basic = Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString("base64");

  let res: Response;
  try {
    res = await fetchWithTimeout(
      TOKEN_URL,
      {
        method: "POST",
        headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
      },
      8_000,
    );
  } catch {
    throw new SpotifyAuthError("Gagal menghubungi Spotify Accounts (timeout/jaringan)", 0);
  }

  if (!res.ok) {
    logger.error("spotify authentication failed", { status: res.status, flow: useRefresh ? "refresh_token" : "client_credentials" });
    throw new SpotifyAuthError(`Autentikasi Spotify ditolak (HTTP ${res.status}). Periksa credential.`, res.status);
  }

  const data = (await res.json()) as { access_token?: unknown; expires_in?: unknown };
  if (typeof data.access_token !== "string" || typeof data.expires_in !== "number") {
    throw new SpotifyAuthError("Respons token Spotify tidak valid", res.status);
  }
  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  logger.info("spotify authentication success", { flow: useRefresh ? "refresh_token" : "client_credentials", expiresInSeconds: data.expires_in });
  return cached.token;
}
