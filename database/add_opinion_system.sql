-- إضافة نظام مقالات الرأي
-- تاريخ: 2025-01-09

-- 1. إضافة enum لأنواع المقالات
ALTER TABLE `articles` 
ADD COLUMN `type` ENUM('NEWS', 'OPINION', 'ANALYSIS', 'INTERVIEW', 'REPORT') DEFAULT 'NEWS' AFTER `category_id`;

-- 2. إنشاء جدول كتّاب الرأي
CREATE TABLE IF NOT EXISTS `opinion_authors` (
  `id` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `bio` text,
  `avatar` text,
  `title` varchar(200),
  `email` varchar(255),
  `twitter` varchar(100),
  `linkedin` varchar(100),
  `specialties` json,
  `is_active` boolean NOT NULL DEFAULT true,
  `display_order` int NOT NULL DEFAULT 0,
  `articles_count` int NOT NULL DEFAULT 0,
  `metadata` json,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `opinion_authors_slug_key` (`slug`),
  KEY `opinion_authors_slug_idx` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. إضافة حقل opinion_author_id للمقالات
ALTER TABLE `articles` 
ADD COLUMN `opinion_author_id` varchar(191) DEFAULT NULL AFTER `author_id`;

-- 4. إضافة الفهارس
ALTER TABLE `articles` 
ADD INDEX `articles_type_idx` (`type`),
ADD INDEX `articles_opinion_author_id_idx` (`opinion_author_id`);

-- 5. إضافة بيانات تجريبية لكتّاب الرأي
INSERT INTO `opinion_authors` (`id`, `name`, `slug`, `bio`, `title`, `is_active`, `display_order`, `created_at`, `updated_at`) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'د. أحمد الغامدي', 'dr-ahmed-alghamdi', 'كاتب ومحلل سياسي، حاصل على دكتوراه في العلوم السياسية من جامعة الملك سعود. له عدة مؤلفات في الشأن السياسي والاجتماعي.', 'محلل سياسي', true, 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'أ. فاطمة العتيبي', 'fatima-alotaibi', 'كاتبة وصحفية متخصصة في القضايا الاجتماعية والثقافية. عضو في جمعية الصحفيين السعوديين.', 'كاتبة صحفية', true, 2, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'د. محمد الشهري', 'dr-mohammed-alshehri', 'أستاذ الاقتصاد بجامعة الملك فهد للبترول والمعادن. خبير اقتصادي ومستشار لعدة جهات حكومية.', 'خبير اقتصادي', true, 3, NOW(), NOW());

-- 6. تحديث عدد المقالات لكل كاتب (trigger)
DELIMITER $$
CREATE TRIGGER update_opinion_author_count_after_insert
AFTER INSERT ON articles
FOR EACH ROW
BEGIN
  IF NEW.opinion_author_id IS NOT NULL AND NEW.type = 'OPINION' THEN
    UPDATE opinion_authors 
    SET articles_count = articles_count + 1 
    WHERE id = NEW.opinion_author_id;
  END IF;
END$$

CREATE TRIGGER update_opinion_author_count_after_delete
AFTER DELETE ON articles
FOR EACH ROW
BEGIN
  IF OLD.opinion_author_id IS NOT NULL AND OLD.type = 'OPINION' THEN
    UPDATE opinion_authors 
    SET articles_count = articles_count - 1 
    WHERE id = OLD.opinion_author_id;
  END IF;
END$$
DELIMITER ; 