-- ملف إدراج التصنيفات الأساسية لمشروع سبق
-- يمكن استخدام هذا الملف لإضافة التصنيفات في قاعدة بيانات الإنتاج

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';

-- إدراج التصنيفات الأساسية
-- استخدام ON DUPLICATE KEY UPDATE لتجنب الأخطاء في حالة وجود تصنيفات بنفس ID
INSERT INTO categories (id, name, name_en, slug, description, color, icon, display_order, is_active, created_at, updated_at) VALUES
(1, 'رياضة', 'Sports', 'sports', 'أخبار رياضية محلية وعالمية', '#10b981', '⚽', 1, 1, NOW(), NOW()),
(2, 'تقنية', 'Technology', 'technology', 'أخبار التقنية والذكاء الاصطناعي', '#8b5cf6', '💻', 2, 1, NOW(), NOW()),
(3, 'اقتصاد', 'Economy', 'economy', 'أخبار الاقتصاد والأعمال', '#f59e0b', '💰', 3, 1, NOW(), NOW()),
(4, 'سياسة', 'Politics', 'politics', 'الأخبار السياسية المحلية والدولية', '#ef4444', '🏛️', 4, 1, NOW(), NOW()),
(5, 'محليات', 'Local', 'local', 'أخبار المناطق والمدن السعودية', '#3b82f6', '🗺️', 5, 1, NOW(), NOW()),
(6, 'ثقافة', 'Culture', 'culture', 'الفعاليات الثقافية والفنية', '#ec4899', '🎭', 6, 1, NOW(), NOW()),
(7, 'صحة', 'Health', 'health', 'أخبار الصحة والطب', '#14b8a6', '🏥', 7, 1, NOW(), NOW()),
(8, 'تعليم', 'Education', 'education', 'أخبار التعليم والجامعات', '#6366f1', '🎓', 8, 1, NOW(), NOW()),
(9, 'سياحة', 'Tourism', 'tourism', 'أخبار السياحة والسفر', '#06b6d4', '✈️', 9, 1, NOW(), NOW()),
(10, 'منوعات', 'Misc', 'misc', 'أخبار منوعة وطرائف', '#6b7280', '🎉', 10, 1, NOW(), NOW()),
(11, 'مجتمع', 'Society', 'society', 'قضايا اجتماعية ومجتمعية', '#a855f7', '👥', 11, 1, NOW(), NOW()),
(12, 'بيئة', 'Environment', 'environment', 'أخبار البيئة والطقس', '#22c55e', '🌿', 12, 1, NOW(), NOW()),
(13, 'سيارات', 'Cars', 'cars', 'أخبار السيارات والمواصلات', '#f97316', '🚗', 13, 1, NOW(), NOW()),
(14, 'عقارات', 'Real Estate', 'real-estate', 'أخبار العقارات والإسكان', '#0ea5e9', '🏠', 14, 1, NOW(), NOW()),
(15, 'طاقة', 'Energy', 'energy', 'أخبار الطاقة والنفط', '#eab308', '⚡', 15, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  name_en = VALUES(name_en),
  description = VALUES(description),
  color = VALUES(color),
  icon = VALUES(icon),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active),
  updated_at = NOW();

-- إضافة metadata للتصنيفات (اختياري)
UPDATE categories SET metadata = JSON_OBJECT(
  'seo_title', CONCAT('أخبار ', name, ' - صحيفة سبق'),
  'seo_description', CONCAT('تابع آخر أخبار ', name, ' والتطورات المحلية والعالمية'),
  'keywords', JSON_ARRAY(name, CONCAT('أخبار ', name), CONCAT(name, ' السعودية'))
) WHERE metadata IS NULL;

-- التحقق من إدراج التصنيفات
SELECT 
  id,
  name,
  name_en,
  slug,
  color,
  icon,
  display_order,
  is_active
FROM categories 
ORDER BY display_order ASC; 