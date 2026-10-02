import { describe, expect, it } from "vitest";
import { classifyType, dedupeTracks, normalizeDate, pickArtwork, toNormalizedRelease } from "./mapper";

describe("spotify mapper", () => {
  it("menormalkan tanggal sesuai presisi", () => {
    expect(normalizeDate("2026", "year")).toBe("2026-01-01");
    expect(normalizeDate("2026-03", "month")).toBe("2026-03-01");
    expect(normalizeDate("2026-03-14", "day")).toBe("2026-03-14");
  });

  it("mengklasifikasi tipe rilisan", () => {
    expect(classifyType("album", 10)).toBe("album");
    expect(classifyType("single", 1)).toBe("single");
    expect(classifyType("single", 5)).toBe("ep");
    expect(classifyType("compilation", 20)).toBe("compilation");
  });

  it("memilih artwork terbesar", () => {
    expect(
      pickArtwork([
        { url: "https://i.scdn.co/small", width: 64 },
        { url: "https://i.scdn.co/big", width: 640 },
      ]),
    ).toBe("https://i.scdn.co/big");
    expect(pickArtwork([])).toBeNull();
  });

  it("membuang track duplikat", () => {
    const t = { externalId: "a", title: "A", durationMs: 1, trackNumber: 1, discNumber: 1, explicit: false, externalUrl: null };
    expect(dedupeTracks([t, { ...t }, { ...t, externalId: "b" }])).toHaveLength(2);
  });

  it("memetakan album; tracks null berarti 'tidak berubah'", () => {
    const release = toNormalizedRelease(
      {
        id: "abc",
        name: "Judul",
        album_type: "single",
        total_tracks: 1,
        release_date: "2026-09",
        release_date_precision: "month",
        images: [],
        external_urls: { spotify: "https://open.spotify.com/album/abc" },
        artists: [{ name: "Gomer Lapudo'oh" }],
      },
      null,
    );
    expect(release.releaseDate).toBe("2026-09-01");
    expect(release.type).toBe("single");
    expect(release.tracks).toBeNull();
    expect(release.artist).toBe("Gomer Lapudo'oh");
  });
});
