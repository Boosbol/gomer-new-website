/** Parser feed Atom YouTube (https://www.youtube.com/feeds/videos.xml?channel_id=...). Tanpa dependensi. */
export interface FeedVideo {
  id: string;
  title: string;
  description: string | null;
  publishedAt: Date;
}

const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");

export function parseYouTubeFeed(xml: string, limit = 12): FeedVideo[] {
  const out: FeedVideo[] = [];
  for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const entry = match[1] ?? "";
    const id = /<yt:videoId>([\w-]{11})<\/yt:videoId>/.exec(entry)?.[1];
    const title = /<title>([\s\S]*?)<\/title>/.exec(entry)?.[1];
    const published = /<published>([^<]+)<\/published>/.exec(entry)?.[1];
    if (!id || !title || !published) continue;
    const publishedAt = new Date(published);
    if (Number.isNaN(publishedAt.getTime())) continue;
    const rawDescription = /<media:description>([\s\S]*?)<\/media:description>/.exec(entry)?.[1];
    out.push({
      id,
      title: decode(title).trim(),
      description: rawDescription ? decode(rawDescription).trim().slice(0, 1000) || null : null,
      publishedAt,
    });
  }
  out.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return out.slice(0, limit);
}
