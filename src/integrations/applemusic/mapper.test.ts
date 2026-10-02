import { describe, expect, it } from "vitest";
import { parseCollectionTitle, safeAppleUrl, toNormalizedRelease, toNormalizedTrack, upscaleArtwork } from "./mapper";

describe("apple music mapper", () => {
  it("memisahkan akhiran Single/EP dari judul", () => {
    expect(parseCollectionTitle("WHY DON'T YOU - Single")).toEqual({ title: "WHY DON'T YOU", type: "single" });
    expect(parseCollectionTitle("Judul Bagus - EP")).toEqual({ title: "Judul Bagus", type: "ep" });
    expect(parseCollectionTitle("Here I Am")).toEqual({ title: "Here I Am", type: "album" });
    expect(parseCollectionTitle("A - B - Single").title).toBe("A - B");
    expect(parseCollectionTitle("Kumpulan", "Compilation").type).toBe("compilation");
  });

  it("hanya menerima URL https ke domain Apple dan membuang query", () => {
    expect(safeAppleUrl("https://music.apple.com/us/album/x/1?uo=4")).toBe("https://music.apple.com/us/album/x/1");
    expect(safeAppleUrl("http://music.apple.com/us/album/x/1")).toBeNull();
    expect(safeAppleUrl("https://evil.example/us/album/x/1")).toBeNull();
    expect(safeAppleUrl("javascript:alert(1)")).toBeNull();
  });

  it("mempertahankan parameter lagu (?i=) saja untuk tautan track", () => {
    expect(safeAppleUrl("https://music.apple.com/us/album/x/1?i=99&uo=4", true)).toBe("https://music.apple.com/us/album/x/1?i=99");
    expect(safeAppleUrl("https://music.apple.com/us/album/x/1?i=abc", true)).toBe("https://music.apple.com/us/album/x/1");
  });

  it("memperbesar sampul hanya untuk domain mzstatic", () => {
    const small = "https://is1-ssl.mzstatic.com/image/thumb/Music/abc/source/100x100bb.jpg";
    expect(upscaleArtwork(small)).toBe("https://is1-ssl.mzstatic.com/image/thumb/Music/abc/source/640x640bb.jpg");
    expect(upscaleArtwork("https://evil.example/100x100bb.jpg")).toBeNull();
    expect(upscaleArtwork(undefined)).toBeNull();
  });

  it("memetakan collection ke rilisan; tracks null = tidak berubah", () => {
    const release = toNormalizedRelease(
      {
        wrapperType: "collection",
        collectionId: 123,
        collectionName: "WHY DON'T YOU - Single",
        artistName: "Gomer Lapudo'oh",
        collectionViewUrl: "https://music.apple.com/us/album/why-dont-you/123?uo=4",
        artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Music/abc/source/100x100bb.jpg",
        trackCount: 1,
        releaseDate: "2026-03-16T07:00:00Z",
        primaryGenreName: "Pop",
      },
      null,
    );
    expect(release).not.toBeNull();
    expect(release?.platform).toBe("appleMusic");
    expect(release?.externalId).toBe("123");
    expect(release?.title).toBe("WHY DON'T YOU");
    expect(release?.type).toBe("single");
    expect(release?.releaseDate).toBe("2026-03-16");
    expect(release?.tracks).toBeNull();
    expect(release?.genres).toEqual(["Pop"]);
  });

  it("melewati rilisan dengan URL/tanggal tidak valid (tidak mengarang data)", () => {
    const bad = {
      wrapperType: "collection" as const,
      collectionId: 1,
      collectionName: "X",
      artistName: "A",
      collectionViewUrl: "https://evil.example/x",
      releaseDate: "2026-03-16T07:00:00Z",
    };
    expect(toNormalizedRelease(bad, null)).toBeNull();
    expect(toNormalizedRelease({ ...bad, collectionViewUrl: "https://music.apple.com/us/album/x/1", releaseDate: "bukan-tanggal" }, null)).toBeNull();
  });

  it("memetakan lagu", () => {
    const t = toNormalizedTrack({ wrapperType: "track", trackId: 5, trackName: "Lagu", trackTimeMillis: 215000, trackExplicitness: "explicit" });
    expect(t).toMatchObject({ externalId: "5", title: "Lagu", durationMs: 215000, trackNumber: 1, discNumber: 1, explicit: true });
  });
});
