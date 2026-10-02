import { z } from "zod";
import { initialContent } from "@/config/content-defaults";
import { socials as defaultSocials, type SocialKey } from "@/config/site";
import { parseYouTubeId } from "@/lib/youtube-url";

/** Isi website yang bisa diedit dari admin. Murni (tanpa akses database) agar mudah diuji. */
export const SOCIAL_KEYS: readonly SocialKey[] = [
  "spotify",
  "bandcamp",
  "appleMusic",
  "youtube",
  "amazonMusic",
  "deezer",
  "youtubeMusic",
  "instagram",
  "facebook",
  "tiktok",
];
/** Ikon besar di footer & di bawah sampul rilisan terbaru. */
export const STREAMING_KEYS: readonly SocialKey[] = ["spotify", "bandcamp", "appleMusic", "youtube", "amazonMusic", "deezer", "youtubeMusic"];
/** Ikon kecil di footer. */
export const FOLLOW_KEYS: readonly SocialKey[] = ["instagram", "facebook", "tiktok"];

/** Peran foto khusus → field di Content. */
export const IMAGE_ROLES = {
  logo: "logoImageId",
  hero: "heroImageId",
  galleryHero: "galleryHeroImageId",
  event: "eventImageId",
} as const;
export type ImageRole = keyof typeof IMAGE_ROLES;

function isHttpsUrl(v: string) {
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
}

const socialUrl = z.string().trim().max(300).refine((v) => v === "" || isHttpsUrl(v), "URL harus diawali https://");
const emailField = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Email tidak valid");
const imageId = z.string().uuid().nullable();

export const contentSchema = z.object({
  tagline: z.string().trim().max(600), // paragraf pengantar di bagian atas halaman depan
  bio: z.string().trim().max(8000),
  contactEmail: emailField,
  whatsapp: z.string().trim().regex(/^(\d{7,15})?$/, "Nomor WhatsApp: hanya angka dengan kode negara"),
  logoImageId: imageId,
  heroImageId: imageId,
  galleryHeroImageId: imageId,
  eventImageId: imageId,
  eventTitle: z.string().trim().max(120),
  eventLine: z.string().trim().max(120),
  eventVenue: z.string().trim().max(240),
  eventVideoUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || parseYouTubeId(v) !== null, "Tautan YouTube tidak dikenali"),
  socials: z.object({
    spotify: socialUrl,
    bandcamp: socialUrl,
    appleMusic: socialUrl,
    youtube: socialUrl,
    amazonMusic: socialUrl,
    deezer: socialUrl,
    youtubeMusic: socialUrl,
    instagram: socialUrl,
    facebook: socialUrl,
    tiktok: socialUrl,
  }),
});

export type Content = z.infer<typeof contentSchema>;

export function defaultContent(): Content {
  return {
    tagline: initialContent.tagline,
    bio: initialContent.bio,
    contactEmail: "",
    whatsapp: "",
    logoImageId: null,
    heroImageId: null,
    galleryHeroImageId: null,
    eventImageId: null,
    eventTitle: initialContent.eventTitle,
    eventLine: initialContent.eventLine,
    eventVenue: initialContent.eventVenue,
    eventVideoUrl: "",
    socials: Object.fromEntries(SOCIAL_KEYS.map((k) => [k, defaultSocials[k].url])) as Content["socials"],
  };
}

/** Membaca JSON tersimpan; field yang hilang/rusak jatuh ke nilai default (tidak pernah melempar error). */
export function parseStoredContent(raw: string | null | undefined): Content {
  const base = defaultContent();
  if (!raw) return base;
  try {
    const stored = JSON.parse(raw) as Record<string, unknown>;
    const candidate = {
      ...base,
      ...stored,
      socials: { ...base.socials, ...((stored.socials as object | undefined) ?? {}) },
    };
    const parsed = contentSchema.safeParse(candidate);
    return parsed.success ? parsed.data : base;
  } catch {
    return base;
  }
}

export function socialsFor(content: Content, keys: readonly SocialKey[]) {
  return keys.map((key) => ({ key, label: defaultSocials[key].label, url: content.socials[key] })).filter((s) => s.url.length > 0);
}

export const socialList = (content: Content) => socialsFor(content, SOCIAL_KEYS);

export function paragraphs(bio: string): string[] {
  return bio
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
