import type { SocialPost, SocialProvider } from "../types";

/**
 * KERANGKA — belum diimplementasikan.
 * Facebook Pages API memerlukan Page Access Token dan izin yang di-review Meta.
 */
export async function getLatestFacebookPosts(_limit = 12): Promise<SocialPost[]> {
  return [];
}

export const facebookProvider: SocialProvider = {
  id: "facebook",
  isConfigured: () => false,
  getLatestPosts: getLatestFacebookPosts,
};
