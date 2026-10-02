-- Skema database website Gomer Lapudo'oh (MySQL 8+ / MariaDB 10.5+).
-- Cara pakai di Hostinger: hPanel → Databases → phpMyAdmin → pilih database Anda → tab "Import" → pilih file ini → Go.
-- Aman dijalankan berulang (IF NOT EXISTS). Tidak ada kolom credential apa pun.
-- Harus selaras dengan src/lib/db/schema.ts.

CREATE TABLE IF NOT EXISTS `releases` (
  `id` varchar(36) NOT NULL,
  `external_id` varchar(128) NOT NULL,
  `platform` varchar(32) NOT NULL DEFAULT 'spotify',
  `type` varchar(16) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `title` varchar(500) NOT NULL,
  `artist` varchar(500) NOT NULL,
  `album` varchar(500) NULL,
  `artwork_url` varchar(1000) NULL,
  `release_date` varchar(10) NOT NULL,
  `release_date_precision` varchar(8) NOT NULL DEFAULT 'day',
  `description` text NULL,
  `external_url` varchar(1000) NOT NULL,
  `genres` json NOT NULL,
  `total_tracks` int NULL,
  `fetched_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `releases_platform_external_uq` (`platform`, `external_id`),
  UNIQUE KEY `releases_slug_uq` (`slug`),
  KEY `releases_release_date_idx` (`release_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tracks` (
  `id` varchar(36) NOT NULL,
  `release_id` varchar(36) NOT NULL,
  `external_id` varchar(128) NOT NULL,
  `title` varchar(500) NOT NULL,
  `duration_ms` int NULL,
  `track_number` int NOT NULL,
  `disc_number` int NOT NULL DEFAULT 1,
  `explicit` tinyint(1) NOT NULL DEFAULT 0,
  `external_url` varchar(1000) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tracks_release_external_uq` (`release_id`, `external_id`),
  CONSTRAINT `tracks_release_id_fk` FOREIGN KEY (`release_id`) REFERENCES `releases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `videos` (
  `id` varchar(36) NOT NULL,
  `platform` varchar(32) NOT NULL DEFAULT 'youtube',
  `external_id` varchar(128) NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text NULL,
  `thumbnail_url` varchar(1000) NULL,
  `url` varchar(1000) NOT NULL,
  `published_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fetched_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `source` varchar(16) NOT NULL DEFAULT 'feed',
  `hidden` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `videos_platform_external_uq` (`platform`, `external_id`),
  KEY `videos_published_idx` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sync_runs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `source` varchar(16) NOT NULL,
  `status` varchar(16) NOT NULL,
  `started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `finished_at` timestamp NULL DEFAULT NULL,
  `items_found` int NOT NULL DEFAULT 0,
  `items_upserted` int NOT NULL DEFAULT 0,
  `error_message` text NULL,
  PRIMARY KEY (`id`),
  KEY `sync_runs_source_started_idx` (`source`, `started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `name` varchar(64) NOT NULL,
  `value` text NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media` (
  `id` varchar(36) NOT NULL,
  `mime` varchar(32) NOT NULL,
  `size_bytes` int NOT NULL,
  `width` int NULL,
  `height` int NULL,
  `caption` varchar(300) NULL,
  `in_gallery` tinyint(1) NOT NULL DEFAULT 1,
  `section_id` varchar(36) NULL,
  `data` mediumblob NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `media_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gallery_sections` (
  `id` varchar(36) NOT NULL,
  `title` varchar(160) NOT NULL,
  `subtitle` varchar(300) NULL,
  `layout` varchar(12) NOT NULL DEFAULT 'rows',
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
