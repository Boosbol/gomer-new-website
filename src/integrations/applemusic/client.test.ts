import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const artistRow = { wrapperType: "artist", artistId: 1508812598, artistName: "Gomer Lapudo'oh" };
const albumRow = (id: number, name: string, date: string) => ({
  wrapperType: "collection",
  collectionType: "Album",
  collectionId: id,
  collectionName: name,
  artistName: "Gomer Lapudo'oh",
  collectionViewUrl: `https://music.apple.com/us/album/x/${id}?uo=4`,
  artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Music/abc/source/100x100bb.jpg",
  trackCount: 1,
  releaseDate: date,
  primaryGenreName: "Pop",
});
const songRow = (id: number) => ({ wrapperType: "track", trackId: id, trackName: `Lagu ${id}`, trackNumber: 1, trackTimeMillis: 1000 });
const reply = (results: unknown[], status = 200) =>
  new Response(JSON.stringify({ resultCount: results.length, results }), { status });

async function load() {
  vi.resetModules();
  const mod = await import("./index");
  mod.retryConfig.baseMs = 1; // jangan menunggu lama saat tes
  return mod;
}

describe("getLatestAppleMusicReleases", () => {
  beforeEach(() => vi.spyOn(console, "warn").mockImplementation(() => {}));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("memetakan rilisan, melewati baris artis, dan mengambil tracklist rilisan baru", async () => {
    const fetchMock = vi.fn(async (input: URL | string) => {
      const url = new URL(String(input));
      if (url.searchParams.get("entity") === "album") {
        return reply([artistRow, albumRow(1, "Satu - Single", "2026-03-16T07:00:00Z"), albumRow(1, "Satu - Single", "2026-03-16T07:00:00Z")]);
      }
      return reply([albumRow(1, "Satu - Single", "2026-03-16T07:00:00Z"), songRow(11)]);
    });
    vi.stubGlobal("fetch", fetchMock);
    const { getLatestAppleMusicReleases } = await load();
    const releases = await getLatestAppleMusicReleases();
    expect(releases).toHaveLength(1); // duplikat collectionId digabung
    expect(releases[0]).toMatchObject({ platform: "appleMusic", externalId: "1", title: "Satu", type: "single" });
    expect(releases[0]?.tracks).toHaveLength(1);
  });

  it("tidak mengambil ulang tracklist untuk rilisan yang sudah lengkap", async () => {
    const fetchMock = vi.fn(async () => reply([artistRow, albumRow(1, "Satu - Single", "2026-03-16T07:00:00Z")]));
    vi.stubGlobal("fetch", fetchMock);
    const { getLatestAppleMusicReleases } = await load();
    const releases = await getLatestAppleMusicReleases({ skipDetailsFor: new Set(["1"]) });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(releases[0]?.tracks).toBeNull();
  });

  it("mengulang permintaan saat dibatasi (403) lalu berhasil", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => new Response("", { status: 403 }))
      .mockImplementation(async () => reply([artistRow, albumRow(2, "Dua", "2025-05-01T00:00:00Z")]));
    vi.stubGlobal("fetch", fetchMock);
    const { getLatestAppleMusicReleases } = await load();
    const releases = await getLatestAppleMusicReleases({ includeTracks: false });
    expect(releases).toHaveLength(1);
  });

  it("melempar error rapi jika terus gagal, tanpa membuat situs crash", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    const { getLatestAppleMusicReleases } = await load();
    await expect(getLatestAppleMusicReleases()).rejects.toMatchObject({ name: "AppleMusicApiError", status: 500 });
  });

  it("satu album gagal tidak menggagalkan seluruh sinkronisasi", async () => {
    const fetchMock = vi.fn(async (input: URL | string) => {
      const url = new URL(String(input));
      if (url.searchParams.get("entity") === "album") return reply([artistRow, albumRow(1, "Satu", "2026-01-01T00:00:00Z")]);
      return new Response("", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { getLatestAppleMusicReleases } = await load();
    const releases = await getLatestAppleMusicReleases();
    expect(releases).toHaveLength(1);
    expect(releases[0]?.tracks).toBeNull(); // akan dicoba lagi pada sinkron berikutnya
  });
});
