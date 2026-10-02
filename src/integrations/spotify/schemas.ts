import { z } from "zod";

// Field yang sudah dihapus Spotify (label, popularity, album_group, available_markets)
// sengaja TIDAK dipakai. Validasi longgar: field opsional diberi default.
const image = z.object({
  url: z.string().url(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
});

export const albumSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  album_type: z.string(),
  total_tracks: z.number().int().nonnegative(),
  release_date: z.string().min(4),
  release_date_precision: z.enum(["year", "month", "day"]),
  images: z.array(image).default([]),
  external_urls: z.object({ spotify: z.string().url() }),
  artists: z.array(z.object({ id: z.string().optional(), name: z.string() })).default([]),
});

export const trackItemSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().min(1),
  duration_ms: z.number().nullable().optional(),
  track_number: z.number().int(),
  disc_number: z.number().int().default(1),
  explicit: z.boolean().default(false),
  external_urls: z.object({ spotify: z.string().url().optional() }).default({}),
});

export const albumPageSchema = z.object({
  items: z.array(z.unknown()),
  next: z.string().nullable().optional(),
});

export const trackPageSchema = z.object({
  items: z.array(z.unknown()),
  next: z.string().nullable().optional(),
});

export const albumDetailSchema = albumSummarySchema.extend({
  genres: z.array(z.string()).default([]),
  tracks: trackPageSchema,
});

export type AlbumSummary = z.infer<typeof albumSummarySchema>;
export type AlbumDetail = z.infer<typeof albumDetailSchema>;
export type TrackItem = z.infer<typeof trackItemSchema>;
