-- صحيفة سبق الذكية - هيكل قاعدة البيانات
-- آخر تحديث: 19 يونيو 2025
-- ملاحظة: المشروع حالياً يستخدم ملفات JSON، هذا مخطط مقترح للترحيل إلى قاعدة بيانات

-- إعدادات قاعدة البيانات
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET COLLATION utf8mb4_unicode_ci;

-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS `sabq_ai_cms` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `sabq_ai_cms`;

-- ====================================
-- جداول المستخدمين والمصادقة
-- ====================================

-- جدول المستخدمين الرئيسي
CREATE TABLE `users` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(500) DEFAULT NULL,
  `role` ENUM('admin', 'editor', 'media', 'vip', 'trainee', 'regular') DEFAULT 'regular',
  `status` ENUM('active', 'suspended', 'banned', 'deleted') DEFAULT 'active',
  `is_verified` BOOLEAN DEFAULT FALSE,
  `email_verified` BOOLEAN DEFAULT FALSE,
  `loyalty_points` INT DEFAULT 0,
  `phone` VARCHAR(20) DEFAULT NULL,
  `gender` ENUM('male', 'female', 'unspecified') DEFAULT 'unspecified',
  `country` VARCHAR(100) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول اهتمامات المستخدمين
CREATE TABLE `user_interests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `interest` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_interest` (`user_id`, `interest`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- جداول المحتوى والمقالات
-- ====================================

-- جدول التصنيفات
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) UNIQUE NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(50),
  `color` VARCHAR(7) DEFAULT '#3B82F6',
  `parent_id` INT DEFAULT NULL,
  `order` INT DEFAULT 0,
  `article_count` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_slug` (`slug`),
  INDEX `idx_parent` (`parent_id`),
  INDEX `idx_order` (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول المقالات
CREATE TABLE `articles` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE NOT NULL,
  `excerpt` TEXT,
  `content` LONGTEXT NOT NULL,
  `featured_image` VARCHAR(500),
  `category_id` INT NOT NULL,
  `author_id` VARCHAR(50) NOT NULL,
  `status` ENUM('published', 'draft', 'scheduled') DEFAULT 'draft',
  `scheduled_for` TIMESTAMP NULL DEFAULT NULL,
  `views` INT DEFAULT 0,
  `likes` INT DEFAULT 0,
  `shares` INT DEFAULT 0,
  `read_time` INT DEFAULT 0,
  `is_ai_generated` BOOLEAN DEFAULT FALSE,
  `ai_prompt` TEXT,
  `published_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`),
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`),
  INDEX `idx_slug` (`slug`),
  INDEX `idx_status` (`status`),
  INDEX `idx_category` (`category_id`),
  INDEX `idx_author` (`author_id`),
  INDEX `idx_published_at` (`published_at`),
  FULLTEXT INDEX `idx_fulltext` (`title`, `excerpt`, `content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول الوسوم
CREATE TABLE `tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(50) UNIQUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول ربط المقالات بالوسوم
CREATE TABLE `article_tags` (
  `article_id` VARCHAR(50) NOT NULL,
  `tag_id` INT NOT NULL,
  PRIMARY KEY (`article_id`, `tag_id`),
  FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- جداول نظام الولاء
-- ====================================

-- جدول نقاط الولاء
CREATE TABLE `user_loyalty_points` (
  `user_id` VARCHAR(50) PRIMARY KEY,
  `total_points` INT DEFAULT 0,
  `earned_points` INT DEFAULT 0,
  `redeemed_points` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول سجل معاملات النقاط
CREATE TABLE `points_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `points` INT NOT NULL,
  `type` ENUM('earned', 'redeemed', 'expired', 'adjusted') NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `reference_type` VARCHAR(50),
  `reference_id` VARCHAR(50),
  `balance_after` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- جداول التفاعلات
-- ====================================

-- جدول تفاعلات المستخدمين مع المقالات
CREATE TABLE `user_article_interactions` (
  `id` VARCHAR(100) PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `article_id` VARCHAR(50) NOT NULL,
  `interaction_type` ENUM('read', 'like', 'share', 'save', 'view') NOT NULL,
  `points_earned` INT DEFAULT 0,
  `duration` INT DEFAULT NULL,
  `metadata` JSON,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_interaction` (`user_id`, `article_id`, `interaction_type`),
  INDEX `idx_user_timestamp` (`user_id`, `timestamp`),
  INDEX `idx_article_type` (`article_id`, `interaction_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- جداول التفضيلات والتخصيص
-- ====================================

-- جدول تفضيلات المستخدمين
CREATE TABLE `user_preferences` (
  `user_id` VARCHAR(50) PRIMARY KEY,
  `notification_email` BOOLEAN DEFAULT TRUE,
  `notification_push` BOOLEAN DEFAULT TRUE,
  `notification_sms` BOOLEAN DEFAULT FALSE,
  `reading_font_size` ENUM('small', 'medium', 'large') DEFAULT 'medium',
  `reading_theme` ENUM('light', 'dark', 'auto') DEFAULT 'auto',
  `language` ENUM('ar', 'en') DEFAULT 'ar',
  `preferences_data` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول التصنيفات المفضلة
CREATE TABLE `user_preferred_categories` (
  `user_id` VARCHAR(50) NOT NULL,
  `category_id` INT NOT NULL,
  `score` FLOAT DEFAULT 1.0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `category_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- جداول الإدارة والسجلات
-- ====================================

-- جدول سجلات المسؤولين
CREATE TABLE `admin_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` VARCHAR(50) NOT NULL,
  `admin_name` VARCHAR(255) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `target_type` VARCHAR(50),
  `target_id` VARCHAR(50),
  `details` JSON,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`),
  INDEX `idx_admin_timestamp` (`admin_id`, `timestamp`),
  INDEX `idx_action` (`action`),
  INDEX `idx_target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- جداول الرسائل والإشعارات
-- ====================================

-- جدول الرسائل
CREATE TABLE `messages` (
  `id` VARCHAR(50) PRIMARY KEY,
  `from_user_id` VARCHAR(50) NOT NULL,
  `to_user_id` VARCHAR(50) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('unread', 'read', 'archived') DEFAULT 'unread',
  `attachments` JSON,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`),
  INDEX `idx_to_status` (`to_user_id`, `status`),
  INDEX `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول الإشعارات
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT,
  `data` JSON,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_read` (`user_id`, `is_read`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- جداول القوالب والتخصيص
-- ====================================

-- جدول القوالب
CREATE TABLE `templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('header', 'footer', 'sidebar') NOT NULL,
  `content` JSON NOT NULL,
  `is_active` BOOLEAN DEFAULT FALSE,
  `is_default` BOOLEAN DEFAULT FALSE,
  `logo_url` VARCHAR(500),
  `primary_color` VARCHAR(7) DEFAULT '#1A73E8',
  `secondary_color` VARCHAR(7) DEFAULT '#34A853',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type_active` (`type`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- جداول إضافية
-- ====================================

-- جدول الجلسات
CREATE TABLE `sessions` (
  `id` VARCHAR(100) PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `payload` TEXT,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_last_activity` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول المقالات المحفوظة
CREATE TABLE `saved_articles` (
  `user_id` VARCHAR(50) NOT NULL,
  `article_id` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `article_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول التعليقات
CREATE TABLE `comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `article_id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `parent_id` INT DEFAULT NULL,
  `content` TEXT NOT NULL,
  `likes` INT DEFAULT 0,
  `is_approved` BOOLEAN DEFAULT TRUE,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`parent_id`) REFERENCES `comments`(`id`) ON DELETE CASCADE,
  INDEX `idx_article_approved` (`article_id`, `is_approved`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Views مفيدة
-- ====================================

-- عرض إحصائيات المستخدمين
CREATE VIEW `user_stats` AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.status,
  COALESCE(ulp.total_points, 0) as loyalty_points,
  COUNT(DISTINCT a.id) as articles_count,
  COUNT(DISTINCT uai.id) as interactions_count,
  COUNT(DISTINCT sa.article_id) as saved_articles_count
FROM users u
LEFT JOIN user_loyalty_points ulp ON u.id = ulp.user_id
LEFT JOIN articles a ON u.id = a.author_id AND a.status = 'published'
LEFT JOIN user_article_interactions uai ON u.id = uai.user_id
LEFT JOIN saved_articles sa ON u.id = sa.user_id
GROUP BY u.id;

-- عرض إحصائيات المقالات
CREATE VIEW `article_stats` AS
SELECT 
  a.id,
  a.title,
  a.slug,
  a.status,
  a.author_id,
  u.name as author_name,
  c.name as category_name,
  a.views,
  a.likes,
  a.shares,
  COUNT(DISTINCT com.id) as comments_count,
  COUNT(DISTINCT sa.user_id) as saves_count,
  a.created_at,
  a.published_at
FROM articles a
JOIN users u ON a.author_id = u.id
JOIN categories c ON a.category_id = c.id
LEFT JOIN comments com ON a.id = com.article_id AND com.is_approved = TRUE AND com.is_deleted = FALSE
LEFT JOIN saved_articles sa ON a.id = sa.article_id
GROUP BY a.id;

-- ====================================
-- Triggers
-- ====================================

-- تحديث عدد المقالات في التصنيف
DELIMITER $$
CREATE TRIGGER update_category_article_count
AFTER INSERT ON articles
FOR EACH ROW
BEGIN
  IF NEW.status = 'published' THEN
    UPDATE categories 
    SET article_count = article_count + 1 
    WHERE id = NEW.category_id;
  END IF;
END$$
DELIMITER ;

-- تحديث نقاط الولاء عند التفاعل
DELIMITER $$
CREATE TRIGGER update_loyalty_points_on_interaction
AFTER INSERT ON user_article_interactions
FOR EACH ROW
BEGIN
  IF NEW.points_earned > 0 THEN
    INSERT INTO user_loyalty_points (user_id, total_points, earned_points)
    VALUES (NEW.user_id, NEW.points_earned, NEW.points_earned)
    ON DUPLICATE KEY UPDATE
      total_points = total_points + NEW.points_earned,
      earned_points = earned_points + NEW.points_earned,
      last_updated = CURRENT_TIMESTAMP;
    
    INSERT INTO points_transactions (user_id, points, type, reason, reference_type, reference_id, balance_after)
    SELECT 
      NEW.user_id, 
      NEW.points_earned, 
      'earned', 
      CONCAT('تفاعل: ', NEW.interaction_type),
      'article',
      NEW.article_id,
      ulp.total_points
    FROM user_loyalty_points ulp
    WHERE ulp.user_id = NEW.user_id;
  END IF;
END$$
DELIMITER ;

-- ====================================
-- إدراج البيانات الأولية
-- ====================================

-- إدراج التصنيفات الافتراضية
INSERT INTO `categories` (`name`, `slug`, `description`, `icon`, `color`, `order`) VALUES
('سياسة', 'politics', 'أخبار سياسية محلية وعالمية', '🏛️', '#DC2626', 1),
('اقتصاد', 'economy', 'أخبار اقتصادية ومالية', '💰', '#059669', 2),
('رياضة', 'sports', 'أخبار رياضية ونتائج المباريات', '⚽', '#7C3AED', 3),
('تقنية', 'technology', 'أخبار التقنية والابتكار', '💻', '#2563EB', 4),
('صحة', 'health', 'أخبار صحية ونصائح طبية', '🏥', '#0891B2', 5),
('ثقافة', 'culture', 'أخبار ثقافية وفنية', '🎭', '#DB2777', 6),
('محليات', 'local', 'أخبار محلية من جميع المناطق', '📍', '#EA580C', 7),
('دولي', 'international', 'أخبار دولية وعالمية', '🌍', '#0EA5E9', 8);

-- إدراج مستخدم افتراضي (admin)
-- كلمة المرور: admin123 (يجب تشفيرها في الإنتاج)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `status`, `is_verified`, `email_verified`) VALUES
('admin-default-001', 'مدير النظام', 'admin@sabq.ai', '$2a$10$YourHashedPasswordHere', 'admin', 'active', TRUE, TRUE);

-- إدراج قالب هيدر افتراضي
INSERT INTO `templates` (`name`, `type`, `content`, `is_active`, `is_default`) VALUES
('القالب الافتراضي', 'header', '{"links": [], "settings": {}}', TRUE, TRUE);

-- ====================================
-- Indexes للأداء
-- ====================================

-- إضافة indexes إضافية للاستعلامات الشائعة
CREATE INDEX `idx_articles_status_published` ON `articles` (`status`, `published_at`);
CREATE INDEX `idx_interactions_user_date` ON `user_article_interactions` (`user_id`, `timestamp`);
CREATE INDEX `idx_users_loyalty` ON `users` (`loyalty_points`);

-- ====================================
-- منح الصلاحيات
-- ====================================

-- إنشاء مستخدم للتطبيق
-- CREATE USER 'sabq_app'@'localhost' IDENTIFIED BY 'StrongPassword123!';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON sabq_ai_cms.* TO 'sabq_app'@'localhost';
-- FLUSH PRIVILEGES; 