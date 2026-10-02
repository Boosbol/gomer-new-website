import { randomUUID } from "node:crypto";
import {
  boolean,
  customType,
  index,
  int,
  json,
  mysqlTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

// Kolom biner untuk foto yang diunggah lewat admin (maks. 16 MB per baris; kita batasi jauh lebih kecil).
const mediumBlob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "mediumblob";
  },
});

// CATATAN: file ini dibaca juga oleh drizzle-kit (CLI), jadi tidak boleh mengimpor "server-only".
// Tidak ada kolom credential apa pun di database.
// Kolom yang diberi indeks unik memakai varchar (MySQL tidak bisa mengindeks TEXT tanpa panjang).

export const releases = mysqlTable(
  "releases",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    externalId: varchar("external_id", { length: 128 }).notNull(), // Spotify album ID
    platform: varchar("platform", { length: 32 }).notNull().default("spotify"),
    type: varchar("type", { length: 16 }).notNull(), // album | single | ep | compilation
    slug: varchar("slug", { length: 191 }).notNull(), // stabil: tidak berubah setelah dibuat (URL /music/[slug])
    title: varchar("title", { length: 500 }).notNull(),
    artist: varchar("artist", { length: 500 }).notNull(),
    album: varchar("album", { length: 500 }),
    artworkUrl: varchar("artwork_url", { length: 1000 }),
    releaseDate: varchar("release_date", { length: 10 }).notNull(), // "YYYY-MM-DD"
    releaseDatePrecision: varchar("release_date_precision", { length: 8 }).notNull().default("day"),
    description: text("description"),
    externalUrl: varchar("external_url", { length: 1000 }).notNull(),
    genres: json("genres").$type<string[]>().notNull(),
    totalTracks: int("total_tracks"),
    fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("releases_platform_external_uq").on(t.platform, t.externalId),
    uniqueIndex("releases_slug_uq").on(t.slug),
    index("releases_release_date_idx").on(t.releaseDate),
  ],
);

export const tracks = mysqlTable(
  "tracks",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    releaseId: varchar("release_id", { length: 36 })
      .notNull()
      .references(() => releases.id, { onDelete: "cascade" }),
    externalId: varchar("external_id", { length: 128 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    durationMs: int("duration_ms"),
    trackNumber: int("track_number").notNull(),
    discNumber: int("disc_number").notNull().default(1),
    explicit: boolean("explicit").notNull().default(false),
    externalUrl: varchar("external_url", { length: 1000 }),
  },
  (t) => [uniqueIndex("tracks_release_external_uq").on(t.releaseId, t.externalId)],
);

export const videos = mysqlTable(
  "videos",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    platform: varchar("platform", { length: 32 }).notNull().default("youtube"),
    externalId: varchar("external_id", { length: 128 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    thumbnailUrl: varchar("thumbnail_url", { length: 1000 }),
    url: varchar("url", { length: 1000 }).notNull(),
    publishedAt: timestamp("published_at").notNull(),
    fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
    source: varchar("source", { length: 16 }).notNull().default("feed"), // feed (otomatis) | manual (ditambah di admin)
    hidden: boolean("hidden").notNull().default(false),
  },
  (t) => [
    uniqueIndex("videos_platform_external_uq").on(t.platform, t.externalId),
    index("videos_published_idx").on(t.publishedAt),
  ],
);

export const syncRuns = mysqlTable(
  "sync_runs",
  {
    id: serial("id").primaryKey(),
    source: varchar("source", { length: 16 }).notNull(), // "music" | "social"
    status: varchar("status", { length: 16 }).notNull(), // running | success | error
    startedAt: timestamp("started_at").notNull().defaultNow(),
    finishedAt: timestamp("finished_at"),
    itemsFound: int("items_found").notNull().default(0),
    itemsUpserted: int("items_upserted").notNull().default(0),
    errorMessage: text("error_message"), // sudah di-scrub dari secret; hanya tampil di admin
  },
  (t) => [index("sync_runs_source_started_idx").on(t.source, t.startedAt)],
);

/** Pengaturan yang bisa diedit dari admin (bio, tagline, link sosial, dll.) disimpan sebagai JSON pada name="content". */
export const settings = mysqlTable("settings", {
  name: varchar("name", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Foto yang diunggah lewat admin. Disimpan di database agar tidak hilang saat deploy ulang. */
export const media = mysqlTable(
  "media",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    mime: varchar("mime", { length: 32 }).notNull(),
    sizeBytes: int("size_bytes").notNull(),
    width: int("width"),
    height: int("height"),
    caption: varchar("caption", { length: 300 }),
    inGallery: boolean("in_gallery").notNull().default(true),
    sectionId: varchar("section_id", { length: 36 }), // bagian galeri (gallery_sections.id), null = tanpa bagian
    data: mediumBlob("data").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("media_created_idx").on(t.createdAt)],
);

/** Bagian di halaman Gallery (mis. "Session photoshoot", "Byron Bay Blues Festival"). */
export const gallerySections = mysqlTable("gallery_sections", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  title: varchar("title", { length: 160 }).notNull(),
  subtitle: varchar("subtitle", { length: 300 }),
  layout: varchar("layout", { length: 12 }).notNull().default("rows"), // rows (baris rata) | masonry (kolom)
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
