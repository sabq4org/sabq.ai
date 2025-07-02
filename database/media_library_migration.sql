-- إضافة جداول مكتبة الوسائط الذكية لصحيفة سبق
-- Media Library Smart Tables for Sabq Newspaper

-- جدول الملفات الوسائط الرئيسي
CREATE TABLE IF NOT EXISTS `media_files` (
  `id` VARCHAR(191) NOT NULL,
  `url` TEXT NOT NULL,
  `type` ENUM('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO') NOT NULL DEFAULT 'IMAGE',
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `tags` JSON, -- ["وزارة", "رسمي", "مؤتمر"]
  `classification` VARCHAR(100), -- "ملك", "وزارة", "حدث", "مبنى"
  `source` VARCHAR(100), -- "داخلي", "وكالة", "موقع رسمي"
  `file_name` VARCHAR(255) NOT NULL,
  `file_size` INT NOT NULL, -- بالبايت
  `mime_type` VARCHAR(100) NOT NULL,
  `width` INT, -- للصور
  `height` INT, -- للصور
  `duration` INT, -- للفيديو بالثواني
  `thumbnail_url` TEXT,
  `ai_entities` JSON, -- ["الملك سلمان", "الرياض"]
  `ai_analysis` JSON, -- نتائج تحليل Vision API
  `uploaded_by` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `last_used_at` DATETIME(3),
  `usage_count` INT NOT NULL DEFAULT 0,
  `is_archived` BOOLEAN NOT NULL DEFAULT FALSE,
  `metadata` JSON,
  
  PRIMARY KEY (`id`),
  INDEX `idx_media_files_type` (`type`),
  INDEX `idx_media_files_classification` (`classification`),
  INDEX `idx_media_files_uploaded_by` (`uploaded_by`),
  INDEX `idx_media_files_created_at` (`created_at`),
  INDEX `idx_media_files_tags` ((CAST(`tags` AS CHAR(255))))
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- جدول ربط الوسائط بالمقالات
CREATE TABLE IF NOT EXISTS `article_media` (
  `id` VARCHAR(191) NOT NULL,
  `article_id` VARCHAR(191) NOT NULL,
  `media_id` VARCHAR(191) NOT NULL,
  `position` VARCHAR(50), -- "featured", "content", "gallery"
  `order_index` INT NOT NULL DEFAULT 0,
  `caption` TEXT,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_article_media_position` (`article_id`, `media_id`, `position`),
  INDEX `idx_article_media_article` (`article_id`),
  INDEX `idx_article_media_media` (`media_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- جدول تصنيفات الوسائط
CREATE TABLE IF NOT EXISTS `media_categories` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `type` VARCHAR(50) NOT NULL, -- "person", "place", "event", "organization"
  `icon` VARCHAR(50),
  `parent_id` VARCHAR(191),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_media_category_name` (`name`),
  UNIQUE KEY `unique_media_category_slug` (`slug`),
  INDEX `idx_media_categories_slug` (`slug`),
  INDEX `idx_media_categories_type` (`type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- جدول ربط الوسائط بالتصنيفات (many-to-many)
CREATE TABLE IF NOT EXISTS `media_file_categories` (
  `id` VARCHAR(191) NOT NULL,
  `media_id` VARCHAR(191) NOT NULL,
  `category_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_media_category` (`media_id`, `category_id`),
  INDEX `idx_media_file_categories_media` (`media_id`),
  INDEX `idx_media_file_categories_category` (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- إدراج التصنيفات الافتراضية
INSERT INTO `media_categories` (`id`, `name`, `slug`, `type`, `icon`) VALUES
-- شخصيات
(UUID(), 'الملك سلمان بن عبدالعزيز', 'king-salman', 'person', '👑'),
(UUID(), 'ولي العهد الأمير محمد بن سلمان', 'crown-prince-mbs', 'person', '👑'),
(UUID(), 'الوزراء', 'ministers', 'person', '👔'),
(UUID(), 'الأمراء', 'princes', 'person', '👑'),
(UUID(), 'المسؤولون', 'officials', 'person', '👔'),

-- جهات
(UUID(), 'الوزارات', 'ministries', 'organization', '🏛️'),
(UUID(), 'الهيئات الحكومية', 'government-bodies', 'organization', '🏢'),
(UUID(), 'المؤسسات الخاصة', 'private-institutions', 'organization', '🏢'),
(UUID(), 'الجامعات', 'universities', 'organization', '🎓'),

-- أماكن
(UUID(), 'المباني الحكومية', 'government-buildings', 'place', '🏛️'),
(UUID(), 'المعالم السياحية', 'tourist-landmarks', 'place', '🗿'),
(UUID(), 'قاعات المناسبات', 'event-halls', 'place', '🏟️'),
(UUID(), 'المساجد', 'mosques', 'place', '🕌'),

-- مناسبات
(UUID(), 'المؤتمرات', 'conferences', 'event', '📊'),
(UUID(), 'الاحتفالات الوطنية', 'national-celebrations', 'event', '🎉'),
(UUID(), 'رمضان', 'ramadan', 'event', '🌙'),
(UUID(), 'الحج والعمرة', 'hajj-umrah', 'event', '🕋'),
(UUID(), 'اليوم الوطني', 'national-day', 'event', '🇸🇦'),
(UUID(), 'المناسبات الرياضية', 'sports-events', 'event', '⚽');

-- إضافة triggers لتحديث usage_count و last_used_at
DELIMITER $$

CREATE TRIGGER update_media_usage_on_insert
AFTER INSERT ON `article_media`
FOR EACH ROW
BEGIN
    UPDATE `media_files` 
    SET `usage_count` = `usage_count` + 1,
        `last_used_at` = NOW()
    WHERE `id` = NEW.`media_id`;
END$$

CREATE TRIGGER update_media_usage_on_delete
AFTER DELETE ON `article_media`
FOR EACH ROW
BEGIN
    UPDATE `media_files` 
    SET `usage_count` = `usage_count` - 1
    WHERE `id` = OLD.`media_id`;
END$$

DELIMITER ; 