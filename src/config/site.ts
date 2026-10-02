/**
 * Konfigurasi publik situs. Isinya BUKAN rahasia — aman terlihat browser.
 * Nilai awal link sosial di bawah bisa diubah dari halaman admin (Biodata & Link) tanpa menyentuh kode.
 */
export const site = {
  name: "Gomer Lapudo'oh",
  description: "Latest releases, videos, photos and streaming links from Gomer Lapudo'oh.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.gomerlapudooh.com").replace(/\/$/, ""),
  locale: "en-AU",
  timeZone: "Asia/Jakarta",
  /** Sumber musik utama (tanpa kunci API): ID artis di Apple Music (angka di akhir URL artis). */
  appleMusicArtistId: "1508812598",
  /** Storefront Apple Music yang dipakai untuk mengambil katalog (kode negara 2 huruf). */
  appleMusicCountry: "US",
  /** Hanya dipakai bila MUSIC_SOURCE=spotify (butuh kunci Spotify). */
  spotifyArtistId: "3ASo1GKycBvn93pURBu6Tk",
  /** ID kanal YouTube (diawali UC). Bisa ditimpa lewat env YOUTUBE_CHANNEL_ID. Kosongkan untuk menonaktifkan video. */
  youtubeChannelId: "UC5le2BbMIRZ_KRqRTxYdgsQ",
} as const;

export type SocialKey =
  | "spotify"
  | "bandcamp"
  | "appleMusic"
  | "youtube"
  | "amazonMusic"
  | "deezer"
  | "youtubeMusic"
  | "instagram"
  | "facebook"
  | "tiktok";

// Nilai awal (bisa diedit di admin). URL kosong = tidak ditampilkan.
export const socials: Record<SocialKey, { label: string; url: string }> = {
  spotify: { label: "Spotify", url: `https://open.spotify.com/artist/${site.spotifyArtistId}` },
  bandcamp: { label: "Bandcamp", url: "https://gomerlapudoohmusic.bandcamp.com" },
  appleMusic: { label: "Apple Music", url: `https://music.apple.com/us/artist/gomer-lapudooh/${site.appleMusicArtistId}` },
  youtube: { label: "YouTube", url: `https://www.youtube.com/channel/${site.youtubeChannelId}` },
  amazonMusic: { label: "Amazon Music", url: "" },
  deezer: { label: "Deezer", url: "" },
  youtubeMusic: { label: "YouTube Music", url: "" },
  instagram: { label: "Instagram", url: "https://www.instagram.com/gomer_lapudooh/" },
  facebook: { label: "Facebook", url: "https://www.facebook.com/LoveLiveMusicAlways/" },
  tiktok: { label: "TikTok", url: "" },
};
