import "server-only";
import { getYouTubeChannelId, isYouTubeConfigured } from "@/lib/env";
import { fetchWithTimeout } from "@/lib/http";
import { logger } from "@/lib/logger";
import type { NormalizedVideo, VideoProvider } from "../types";
import { parseYouTubeFeed } from "./feed";

/**
 * Video terbaru lewat feed RSS publik kanal — tanpa API key dan tanpa kuota.
 * Thumbnail dibangun dari ID video (domain i.ytimg.com), bukan dari isi feed.
 */
export async function getLatestYouTubeVideos(limit = 12): Promise<NormalizedVideo[]> {
  const channelId = getYouTubeChannelId();
  if (!channelId) return [];

  const url = new URL("https://www.youtube.com/feeds/videos.xml");
  url.searchParams.set("channel_id", channelId);

  const res = await fetchWithTimeout(url, { cache: "no-store", headers: { Accept: "application/atom+xml, application/xml" } }, 10_000);
  if (!res.ok) throw new Error(`Feed YouTube merespons HTTP ${res.status}`);

  const videos: NormalizedVideo[] = parseYouTubeFeed(await res.text(), limit).map((v) => ({
    platform: "youtube",
    externalId: v.id,
    title: v.title,
    description: v.description,
    thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    publishedAt: v.publishedAt,
    url: `https://www.youtube.com/watch?v=${v.id}`,
  }));
  logger.info("videos fetched", { provider: "youtube", count: videos.length });
  return videos;
}

export const youtubeProvider: VideoProvider = {
  id: "youtube",
  isConfigured: isYouTubeConfigured,
  getLatestVideos: getLatestYouTubeVideos,
};
