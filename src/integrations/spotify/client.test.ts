import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Env harus diatur sebelum modul dimuat; resetModules memastikan cache token bersih tiap tes.
async function load() {
  vi.resetModules();
  process.env.SPOTIFY_CLIENT_ID = "test-client-id";
  process.env.SPOTIFY_CLIENT_SECRET = "test-client-secret-value";
  delete process.env.SPOTIFY_REFRESH_TOKEN;
  return import("./client");
}

const tokenResponse = () => new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("spotifyGet", () => {
  beforeEach(() => vi.spyOn(console, "log").mockImplementation(() => {}));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("memakai ulang access token untuk beberapa request", async () => {
    const fetchMock = vi.fn().mockImplementationOnce(async () => tokenResponse()).mockImplementation(async () => ok({ a: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const { spotifyGet } = await load();
    await spotifyGet("/artists/x/albums");
    await spotifyGet("/albums/y");
    const tokenCalls = fetchMock.mock.calls.filter((c) => String(c[0]).includes("accounts.spotify.com"));
    expect(tokenCalls).toHaveLength(1);
  });

  it("me-refresh token otomatis saat 401", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => tokenResponse())
      .mockImplementationOnce(async () => new Response("", { status: 401 }))
      .mockImplementationOnce(async () => tokenResponse())
      .mockImplementationOnce(async () => ok({ done: true }));
    vi.stubGlobal("fetch", fetchMock);
    const { spotifyGet } = await load();
    await expect(spotifyGet("/albums/y")).resolves.toEqual({ done: true });
  });

  it("menangani 429 dengan Retry-After pendek lalu berhasil", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => tokenResponse())
      .mockImplementationOnce(async () => new Response("", { status: 429, headers: { "retry-after": "0" } }))
      .mockImplementationOnce(async () => ok({ done: true }));
    vi.stubGlobal("fetch", fetchMock);
    const { spotifyGet } = await load();
    await expect(spotifyGet("/albums/y")).resolves.toEqual({ done: true });
  });

  it("melempar SpotifyRateLimitError jika Retry-After terlalu lama", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => tokenResponse())
      .mockImplementation(async () => new Response("", { status: 429, headers: { "retry-after": "120" } }));
    vi.stubGlobal("fetch", fetchMock);
    const { spotifyGet } = await load();
    await expect(spotifyGet("/albums/y")).rejects.toMatchObject({ name: "SpotifyRateLimitError", retryAfterSeconds: 120 });
  });

  it("gagal dengan rapi saat credential ditolak, tanpa membocorkan secret", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("{}", { status: 400 })));
    const { spotifyGet } = await load();
    const error = await spotifyGet("/albums/y").catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).name).toBe("SpotifyAuthError");
    expect((error as Error).message).not.toContain("test-client-secret-value");
  });

  it("menolak host selain api.spotify.com", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { spotifyGet } = await load();
    await expect(spotifyGet("https://evil.example/v1/albums")).rejects.toThrow();
  });
});
