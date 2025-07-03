-- نظام التعليقات الذكي
-- =====================

-- جدول التعليقات الرئيسي
CREATE TABLE IF NOT EXISTS `comments` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) DEFAULT NULL,
  `article_id` varchar(191) NOT NULL,
  `parent_id` varchar(191) DEFAULT NULL,
  `content` text NOT NULL,
  `status` enum('pending','approved','rejected','reported','archived') DEFAULT 'pending',
  `edited_at` datetime(3) DEFAULT NULL,
  `edited_by` varchar(191) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `metadata` json DEFAULT NULL,
  `created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `comments_article_id_idx` (`article_id`),
  KEY `comments_user_id_idx` (`user_id`),
  KEY `comments_parent_id_idx` (`parent_id`),
  KEY `comments_status_idx` (`status`),
  KEY `comments_created_at_idx` (`created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- جدول التفاعلات على التعليقات
CREATE TABLE IF NOT EXISTS `comment_reactions` (
  `id` varchar(191) NOT NULL,
  `comment_id` varchar(191) NOT NULL,
  `user_id` varchar(191) DEFAULT NULL,
  `reaction_type` enum('like','dislike','love','angry','sad','wow') DEFAULT 'like',
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `comment_reactions_unique` (`comment_id`, `user_id`),
  KEY `comment_reactions_comment_id_idx` (`comment_id`),
  KEY `comment_reactions_user_id_idx` (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- جدول البلاغات على التعليقات
CREATE TABLE IF NOT EXISTS `comment_reports` (
  `id` varchar(191) NOT NULL,
  `comment_id` varchar(191) NOT NULL,
  `reporter_id` varchar(191) DEFAULT NULL,
  `reason` enum('spam','offensive','misleading','harassment','other') NOT NULL,
  `description` text,
  `status` enum('pending','reviewed','resolved','dismissed') DEFAULT 'pending',
  `reviewed_by` varchar(191) DEFAULT NULL,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `resolution_notes` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `comment_reports_comment_id_idx` (`comment_id`),
  KEY `comment_reports_reporter_id_idx` (`reporter_id`),
  KEY `comment_reports_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- جدول الكلمات المحظورة
CREATE TABLE IF NOT EXISTS `banned_words` (
  `id` varchar(191) NOT NULL,
  `word` varchar(255) NOT NULL,
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `action` enum('flag','reject','replace') DEFAULT 'flag',
  `replacement` varchar(255) DEFAULT '***',
  `is_active` boolean DEFAULT true,
  `created_by` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `banned_words_word_key` (`word`),
  KEY `banned_words_is_active_idx` (`is_active`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- جدول سجل الإشراف على التعليقات
CREATE TABLE IF NOT EXISTS `comment_moderation_logs` (
  `id` varchar(191) NOT NULL,
  `comment_id` varchar(191) NOT NULL,
  `moderator_id` varchar(191) NOT NULL,
  `action` enum('approve','reject','edit','delete','archive','restore') NOT NULL,
  `reason` text,
  `old_content` text,
  `new_content` text,
  `created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `moderation_logs_comment_id_idx` (`comment_id`),
  KEY `moderation_logs_moderator_id_idx` (`moderator_id`),
  KEY `moderation_logs_action_idx` (`action`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- جدول إعدادات التعليقات لكل مقال
CREATE TABLE IF NOT EXISTS `article_comment_settings` (
  `id` varchar(191) NOT NULL,
  `article_id` varchar(191) NOT NULL,
  `comments_enabled` boolean DEFAULT true,
  `requires_approval` boolean DEFAULT true,
  `close_after_days` int DEFAULT NULL,
  `closed_at` datetime(3) DEFAULT NULL,
  `max_depth` int DEFAULT 3,
  `created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `article_comment_settings_article_id_key` (`article_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- إضافة بعض الكلمات المحظورة الافتراضية
INSERT INTO `banned_words` (`id`, `word`, `severity`, `action`) VALUES
(UUID(), 'كلمة_سيئة_1', 'high', 'reject'),
(UUID(), 'كلمة_سيئة_2', 'medium', 'replace'),
(UUID(), 'سبام', 'low', 'flag')
ON DUPLICATE KEY UPDATE word=word;

-- إضافة الأعمدة الجديدة إلى جدول المقالات إذا لم تكن موجودة
-- ALTER TABLE `articles` ADD COLUMN IF NOT EXISTS `comments_count` int DEFAULT 0;
-- ALTER TABLE `articles` ADD COLUMN IF NOT EXISTS `last_comment_at` datetime(3) DEFAULT NULL;

-- إنشاء فهارس إضافية لتحسين الأداء
-- ملاحظة: PlanetScale لا يدعم IF NOT EXISTS للفهارس
-- CREATE INDEX `comments_status_created_idx` ON `comments` (`status`, `created_at`);
-- CREATE INDEX `comments_article_status_idx` ON `comments` (`article_id`, `status`);
-- CREATE INDEX `comment_reports_created_idx` ON `comment_reports` (`created_at`); 