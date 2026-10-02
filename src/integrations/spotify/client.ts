import "server-only";
import { fetchWithTimeout, sleep } from "@/lib/http";
import { logger } from "@/lib/logger";
import { getSpotifyAccessToken, invalidateSpotifyToken } from "./auth";
import { SpotifyApiError, SpotifyRateLimitError } from "./errors";

const API_BASE = "https://api.spotify.com/v1";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const MAX_INLINE_WAIT_S = 5; // jika Retry-After lebih lama, jangan menunggu — gagal dan coba lagi di sync berikutnya
const RETRY_PAD_MS = 250;

const backoff = (attempt: number) => 400 * 2 ** attempt;

/**
 * GET ke Spotify Web API dengan: timeout, refresh token otomatis saat 401,
 * penanganan 429 (Retry-After), dan retry terbatas untuk 5xx/jaringan.
 * Host dibatasi ke api.spotify.com (melindungi dari URL `next` yang tidak terduga).
 */
export async function spotifyGet(pathOrUrl: string, params: Record<string, string | number> = {}): Promise<unknown> {
  const url = pathOrUrl.startsWith("https://") ? new URL(pathOrUrl) : new URL(API_BASE + pathOrUrl);
  if (url.hostname !== "api.spotify.com") throw new SpotifyApiError("Host Spotify tidak dikenal", 0);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  let attempt = 0;
  let refreshedAfter401 = false;

  for (;;) {
    const token = await getSpotifyAccessToken();
    let res: Response;
    try {
      res = await fetchWithTimeout(
        url,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" },
        REQUEST_TIMEOUT_MS,
      );
    } catch {
      if (attempt < MAX_RETRIES) {
        await sleep(backoff(attempt++));
        continue;
      }
      throw new SpotifyApiError("Permintaan ke Spotify gagal atau timeout", 0);
    }

    if (res.ok) return res.json();

    if (res.status === 401 && !refreshedAfter401) {
      refreshedAfter401 = true;
      invalidateSpotifyToken(); // token kedaluwarsa/dicabut → minta yang baru sekali
      continue;
    }

    if (res.status === 429) {
      const retryAfter = Math.max(0, Number(res.headers.get("retry-after") ?? "1") || 1);
      if (retryAfter <= MAX_INLINE_WAIT_S && attempt < MAX_RETRIES) {
        attempt++;
        logger.warn("spotify rate limited; waiting", { retryAfter });
        await sleep(retryAfter * 1000 + RETRY_PAD_MS);
        continue;
      }
      throw new SpotifyRateLimitError(retryAfter);
    }

    if (res.status >= 500 && attempt < MAX_RETRIES) {
      await sleep(backoff(attempt++));
      continue;
    }

    const hint =
      res.status === 403
        ? " (403: pastikan pemilik app Spotify berlangganan Premium dan endpoint diizinkan untuk Development Mode)"
        : "";
    throw new SpotifyApiError(`Spotify API merespons HTTP ${res.status}${hint}`, res.status);
  }
}
