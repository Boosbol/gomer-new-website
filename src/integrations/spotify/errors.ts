export class SpotifyConfigError extends Error {
  constructor(message = "SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET belum diatur") {
    super(message);
    this.name = "SpotifyConfigError";
  }
}

export class SpotifyAuthError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "SpotifyAuthError";
  }
}

export class SpotifyApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "SpotifyApiError";
  }
}

export class SpotifyRateLimitError extends SpotifyApiError {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Spotify rate limit tercapai; coba lagi dalam ${retryAfterSeconds} detik`, 429);
    this.name = "SpotifyRateLimitError";
  }
}
