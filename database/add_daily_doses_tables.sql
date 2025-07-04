-- إضافة جداول الجرعات اليومية
-- Daily Doses System Tables

-- جدول الجرعات اليومية
CREATE TABLE IF NOT EXISTS `daily_doses` (
  `id` VARCHAR(191) NOT NULL,
  `period` ENUM('morning', 'afternoon', 'evening', 'night') NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `subtitle` VARCHAR(500) NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('draft', 'published', 'scheduled', 'archived') NOT NULL DEFAULT 'draft',
  `published_at` DATETIME(3) NULL,
  `views` INTEGER NOT NULL DEFAULT 0,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `daily_doses_date_period_key` (`date`, `period`),
  INDEX `daily_doses_date_idx` (`date`),
  INDEX `daily_doses_period_idx` (`period`),
  INDEX `daily_doses_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- جدول محتويات الجرعة
CREATE TABLE IF NOT EXISTS `dose_contents` (
  `id` VARCHAR(191) NOT NULL,
  `dose_id` VARCHAR(191) NOT NULL,
  `article_id` VARCHAR(191) NULL,
  `content_type` ENUM('article', 'weather', 'quote', 'tip', 'audio', 'analysis') NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `summary` TEXT NOT NULL,
  `audio_url` TEXT NULL,
  `image_url` TEXT NULL,
  `display_order` INTEGER NOT NULL DEFAULT 0,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `dose_contents_dose_id_idx` (`dose_id`),
  INDEX `dose_contents_article_id_idx` (`article_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 