import { describe, expect, it } from "vitest";
import { parseYouTubeFeed } from "./feed";

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
  <title>Gomer Lapudo'oh</title>
  <entry>
    <id>yt:video:AAAAAAAAAAA</id>
    <yt:videoId>AAAAAAAAAAA</yt:videoId>
    <title>Lagu Lama &amp; Baru</title>
    <published>2025-01-02T03:04:05+00:00</published>
    <media:group><media:title>Lagu Lama &amp; Baru</media:title><media:description>Deskripsi &quot;satu&quot;</media:description></media:group>
  </entry>
  <entry>
    <id>yt:video:BBBBBBBBBBB</id>
    <yt:videoId>BBBBBBBBBBB</yt:videoId>
    <title>Video Terbaru</title>
    <published>2026-03-01T00:00:00+00:00</published>
  </entry>
  <entry>
    <yt:videoId>bad id!</yt:videoId>
    <title>Rusak</title>
    <published>2026-03-02T00:00:00+00:00</published>
  </entry>
</feed>`;

describe("parseYouTubeFeed", () => {
  it("mengurutkan terbaru dulu, mendekode entitas, dan melewati entri rusak", () => {
    const videos = parseYouTubeFeed(feed);
    expect(videos.map((v) => v.id)).toEqual(["BBBBBBBBBBB", "AAAAAAAAAAA"]);
    expect(videos[1]?.title).toBe("Lagu Lama & Baru");
    expect(videos[1]?.description).toBe('Deskripsi "satu"');
    expect(videos[0]?.description).toBeNull();
  });

  it("menghormati limit dan aman untuk input kosong", () => {
    expect(parseYouTubeFeed(feed, 1)).toHaveLength(1);
    expect(parseYouTubeFeed("")).toEqual([]);
  });
});
