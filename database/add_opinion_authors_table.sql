-- إنشاء جدول كتّاب الرأي
CREATE TABLE IF NOT EXISTS `opinion_authors` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `bio` text,
  `avatar` text,
  `title` varchar(200),
  `email` varchar(191),
  `twitter` varchar(191),
  `linkedin` varchar(191),
  `specialties` json DEFAULT NULL,
  `is_active` boolean DEFAULT true,
  `display_order` int DEFAULT 0,
  `articles_count` int DEFAULT 0,
  `metadata` json DEFAULT NULL,
  `created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `opinion_authors_slug_key` (`slug`),
  KEY `opinion_authors_slug_idx` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- إضافة حقل نوع المقال إلى جدول المقالات إذا لم يكن موجوداً
-- ALTER TABLE `articles` ADD COLUMN `type` ENUM('NEWS', 'OPINION', 'ANALYSIS', 'INTERVIEW', 'REPORT') DEFAULT 'NEWS' AFTER `category_id`;

-- إضافة حقل كاتب الرأي إلى جدول المقالات
-- ALTER TABLE `articles` ADD COLUMN `opinion_author_id` varchar(191) DEFAULT NULL AFTER `author_id`;

-- إضافة فهرس لحقل نوع المقال
-- ALTER TABLE `articles` ADD INDEX `articles_type_idx` (`type`);

-- إضافة فهرس لحقل كاتب الرأي
-- ALTER TABLE `articles` ADD INDEX `articles_opinion_author_id_idx` (`opinion_author_id`); 