import type { SocialPost, SocialProvider } from "../types";

/**
 * KERANGKA — belum diimplementasikan.
 * TikTok (Display API / Login Kit) memerlukan app review; aktifkan hanya bila memang dibutuhkan.
 */
export async function getLatestTikTokVideos(_limit = 12): Promise<SocialPost[]> {
  return [];
}

export const tiktokProvider: SocialProvider = {
  id: "tiktok",
  isConfigured: () => false,
  getLatestPosts: getLatestTikTokVideos,
};
