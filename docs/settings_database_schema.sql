-- 🗄️ مخطط قاعدة البيانات لإعدادات صحيفة سبق
-- Database Schema for Sabq Newspaper Settings

-- ===================================
-- طريقة 1: جدول واحد للإعدادات (مرن)
-- ===================================

CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  category VARCHAR(100) DEFAULT 'general',
  data_type VARCHAR(50) DEFAULT 'string', -- string, boolean, number, json
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- هل يمكن الوصول للإعداد من الواجهة العامة؟
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- فهارس للأداء
CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_category ON settings(category);
CREATE INDEX idx_settings_public ON settings(is_public);

-- إدراج البيانات الافتراضية
INSERT INTO settings (key, value, category, data_type, description, is_public) VALUES
-- إعدادات الهوية
('site_name', 'صحيفة سبق الإلكترونية', 'identity', 'string', 'اسم الصحيفة', TRUE),
('site_description', 'صحيفة سعودية إلكترونية رائدة', 'identity', 'string', 'وصف الصحيفة', TRUE),
('site_url', 'https://sabq.org', 'identity', 'string', 'الرابط الأساسي', TRUE),
('default_language', 'ar', 'identity', 'string', 'اللغة الافتراضية', TRUE),
('timezone', 'Asia/Riyadh', 'identity', 'string', 'المنطقة الزمنية', FALSE),

-- إعدادات SEO
('meta_title', 'صحيفة سبق - آخر الأخبار', 'seo', 'string', 'عنوان الصفحة', TRUE),
('meta_description', 'اطلع على آخر الأخبار في صحيفة سبق', 'seo', 'string', 'وصف الصفحة', TRUE),
('keywords', 'أخبار، السعودية، سبق، صحيفة', 'seo', 'string', 'الكلمات المفتاحية', TRUE),
('sitemap_enabled', 'true', 'seo', 'boolean', 'تفعيل sitemap', FALSE),

-- إعدادات التواصل
('contact_email', 'info@sabq.org', 'social', 'string', 'البريد الرسمي', TRUE),
('support_phone', '920012345', 'social', 'string', 'رقم الدعم', TRUE),

-- إعدادات المحتوى
('articles_per_page', '8', 'content', 'number', 'عدد المقالات بالصفحة', FALSE),
('allow_comments', 'true', 'content', 'boolean', 'السماح بالتعليقات', TRUE),

-- إعدادات AI
('ai_suggested_titles', 'true', 'ai', 'boolean', 'عناوين AI المقترحة', FALSE),
('ai_auto_summary', 'true', 'ai', 'boolean', 'التلخيص التلقائي', FALSE),

-- إعدادات الأمان
('enable_2fa', 'true', 'security', 'boolean', 'المصادقة الثنائية', FALSE),
('max_failed_logins', '5', 'security', 'number', 'محاولات الدخول الخاطئة', FALSE);

-- ===================================
-- طريقة 2: جداول منفصلة حسب الفئة
-- ===================================

-- جدول إعدادات الهوية
CREATE TABLE site_settings (
  id SERIAL PRIMARY KEY,
  site_name VARCHAR(255) NOT NULL DEFAULT 'صحيفة سبق الإلكترونية',
  site_description TEXT,
  site_url VARCHAR(255) NOT NULL DEFAULT 'https://sabq.org',
  logo_main VARCHAR(255),
  logo_mini VARCHAR(255),
  default_language VARCHAR(10) DEFAULT 'ar',
  default_country VARCHAR(10) DEFAULT 'SA',
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  date_format VARCHAR(50) DEFAULT 'DD MMMM YYYY - hh:mm A',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- جدول إعدادات SEO
CREATE TABLE seo_settings (
  id SERIAL PRIMARY KEY,
  meta_title VARCHAR(255),
  meta_description TEXT,
  keywords TEXT,
  og_image VARCHAR(255),
  og_type VARCHAR(50) DEFAULT 'website',
  canonical_url VARCHAR(255),
  robots_txt TEXT DEFAULT 'User-agent: *\nAllow: /',
  sitemap_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- جدول إعدادات التواصل الاجتماعي
CREATE TABLE social_settings (
  id SERIAL PRIMARY KEY,
  twitter_url VARCHAR(255),
  instagram_url VARCHAR(255),
  facebook_url VARCHAR(255),
  youtube_url VARCHAR(255),
  ios_app_url VARCHAR(255),
  android_app_url VARCHAR(255),
  contact_email VARCHAR(255),
  support_phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- جدول إعدادات المحتوى
CREATE TABLE content_settings (
  id SERIAL PRIMARY KEY,
  auto_activate_articles BOOLEAN DEFAULT TRUE,
  enable_editorial_review BOOLEAN DEFAULT TRUE,
  articles_per_page INTEGER DEFAULT 8,
  breaking_news_duration INTEGER DEFAULT 90, -- بالدقائق
  auto_shorten_titles BOOLEAN DEFAULT FALSE,
  show_read_count BOOLEAN DEFAULT TRUE,
  allow_comments BOOLEAN DEFAULT TRUE,
  moderate_comments BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- جدول إعدادات الذكاء الاصطناعي
CREATE TABLE ai_settings (
  id SERIAL PRIMARY KEY,
  ai_suggested_titles BOOLEAN DEFAULT TRUE,
  ai_auto_summary BOOLEAN DEFAULT TRUE,
  ai_editor_hints BOOLEAN DEFAULT TRUE,
  ai_custom_model BOOLEAN DEFAULT FALSE,
  ai_output_language VARCHAR(10) DEFAULT 'auto', -- 'auto', 'ar', 'en'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- جدول إعدادات الأمان
CREATE TABLE security_settings (
  id SERIAL PRIMARY KEY,
  enable_2fa BOOLEAN DEFAULT TRUE,
  max_failed_logins INTEGER DEFAULT 5,
  allowed_ips TEXT, -- قائمة مفصولة بفواصل
  settings_change_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- جدول إعدادات النسخ الاحتياطي
CREATE TABLE backup_settings (
  id SERIAL PRIMARY KEY,
  backup_frequency VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly', 'manual'
  backup_notifications BOOLEAN DEFAULT TRUE,
  update_notifications BOOLEAN DEFAULT TRUE,
  log_settings_changes BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- ===================================
-- جدول سجل التعديلات
-- ===================================
CREATE TABLE settings_changelog (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- فهارس لسجل التعديلات
CREATE INDEX idx_changelog_setting ON settings_changelog(setting_key);
CREATE INDEX idx_changelog_user ON settings_changelog(changed_by);
CREATE INDEX idx_changelog_date ON settings_changelog(created_at);

-- ===================================
-- دوال مساعدة (PostgreSQL)
-- ===================================

-- دالة لجلب قيمة إعداد
CREATE OR REPLACE FUNCTION get_setting(setting_key VARCHAR)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value 
  FROM settings 
  WHERE key = setting_key;
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث قيمة إعداد مع تسجيل التغيير
CREATE OR REPLACE FUNCTION update_setting(
  setting_key VARCHAR,
  new_value TEXT,
  user_id VARCHAR,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  old_value TEXT;
  setting_category VARCHAR(100);
BEGIN
  -- جلب القيمة القديمة والفئة
  SELECT value, category INTO old_value, setting_category 
  FROM settings 
  WHERE key = setting_key;
  
  -- تحديث القيمة
  UPDATE settings 
  SET value = new_value, 
      updated_at = CURRENT_TIMESTAMP,
      updated_by = user_id
  WHERE key = setting_key;
  
  -- تسجيل التغيير
  INSERT INTO settings_changelog (
    setting_key, old_value, new_value, category, 
    changed_by, change_reason
  ) VALUES (
    setting_key, old_value, new_value, setting_category,
    user_id, reason
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- أمثلة على الاستخدام
-- ===================================

-- جلب إعداد
-- SELECT get_setting('site_name');

-- تحديث إعداد
-- SELECT update_setting('site_name', 'صحيفة سبق الجديدة', 'admin', 'تحديث اسم الموقع');

-- جلب جميع الإعدادات العامة
-- SELECT * FROM settings WHERE is_public = TRUE;

-- جلب إعدادات فئة معينة
-- SELECT * FROM settings WHERE category = 'seo';

-- ===================================
-- فهارس للأداء المحسن
-- ===================================
CREATE INDEX idx_settings_updated_at ON settings(updated_at);
CREATE INDEX idx_changelog_created_at ON settings_changelog(created_at DESC);

-- ===================================
-- تشفير الإعدادات الحساسة (اختياري)
-- ===================================
-- يمكن إضافة عمود encrypted للإعدادات الحساسة
-- ALTER TABLE settings ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;

-- ===================================
-- تحديث تلقائي لـ updated_at
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_updated_at 
  BEFORE UPDATE ON settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 