import { z } from "zod";

/** Respons iTunes Lookup API (gratis, tanpa kunci). Validasi longgar; field opsional diberi default. */
export const lookupSchema = z.object({
  resultCount: z.number().optional(),
  results: z.array(z.unknown()).default([]),
});

export const collectionSchema = z.object({
  wrapperType: z.literal("collection"),
  collectionType: z.string().optional(),
  collectionId: z.number().int(),
  collectionName: z.string().min(1),
  artistName: z.string().default(""),
  collectionViewUrl: z.string().url(),
  artworkUrl100: z.string().url().optional(),
  trackCount: z.number().int().nonnegative().optional(),
  releaseDate: z.string().min(10),
  primaryGenreName: z.string().optional(),
});

export const songSchema = z.object({
  wrapperType: z.literal("track"),
  trackId: z.number().int(),
  trackName: z.string().min(1),
  trackNumber: z.number().int().optional(),
  discNumber: z.number().int().optional(),
  trackTimeMillis: z.number().nullable().optional(),
  trackExplicitness: z.string().optional(),
  trackViewUrl: z.string().url().optional(),
});

export type Collection = z.infer<typeof collectionSchema>;
export type Song = z.infer<typeof songSchema>;
