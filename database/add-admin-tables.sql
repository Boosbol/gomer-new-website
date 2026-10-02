-- HANYA jika Anda SUDAH mengimpor schema.sql versi lama (sebelum fitur admin). Jika belum, cukup impor schema.sql terbaru.
-- phpMyAdmin → pilih database → tab Import → pilih file ini → Go.
-- Dua perintah ALTER di bawah akan error "Duplicate column name" bila kolomnya sudah ada — itu aman diabaikan.

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

ALTER TABLE `videos` ADD COLUMN `source` varchar(16) NOT NULL DEFAULT 'feed';
ALTER TABLE `videos` ADD COLUMN `hidden` tinyint(1) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS `gallery_sections` (
  `id` varchar(36) NOT NULL,
  `title` varchar(160) NOT NULL,
  `subtitle` varchar(300) NULL,
  `layout` varchar(12) NOT NULL DEFAULT 'rows',
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hanya jika tabel `media` sudah ada dari versi sebelumnya (abaikan error "Duplicate column name"):
ALTER TABLE `media` ADD COLUMN `section_id` varchar(36) NULL;
