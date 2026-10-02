import type { SocialPost, SocialProvider } from "../types";

/**
 * KERANGKA — belum diimplementasikan.
 * Saat dibutuhkan: Instagram Graph API (akun Business/Creator + token jangka panjang).
 * Tambahkan credential ke .env.example HANYA saat implementasi dibuat, baca lewat src/lib/env.ts,
 * lalu isi getLatestInstagramPosts() dan daftarkan (isConfigured → true) di registry.
 */
export async function getLatestInstagramPosts(_limit = 12): Promise<SocialPost[]> {
  return [];
}

export const instagramProvider: SocialProvider = {
  id: "instagram",
  isConfigured: () => false,
  getLatestPosts: getLatestInstagramPosts,
};
