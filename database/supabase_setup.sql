-- إعداد قاعدة البيانات لمشروع SABQ AI CMS
-- انسخ هذا الكود والصقه في Supabase SQL Editor

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الفئات
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  slug VARCHAR(255) UNIQUE NOT NULL,
  color_hex VARCHAR(7) DEFAULT '#000000',
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول المقالات
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(500),
  content TEXT,
  content_blocks JSONB,
  featured_image VARCHAR(500),
  category_id INTEGER REFERENCES categories(id),
  author_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'draft',
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول التفاعلات
CREATE TABLE IF NOT EXISTS user_article_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  article_id UUID REFERENCES articles(id),
  interaction_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, article_id, interaction_type)
);

-- جدول نقاط الولاء
CREATE TABLE IF NOT EXISTS user_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  points INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  level VARCHAR(50) DEFAULT 'مبتدئ',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إضافة بعض الفئات الافتراضية
INSERT INTO categories (name_ar, name_en, slug, color_hex, icon) VALUES
('أخبار محلية', 'Local News', 'local-news', '#FF6B6B', 'newspaper'),
('تقنية', 'Technology', 'technology', '#4ECDC4', 'cpu'),
('رياضة', 'Sports', 'sports', '#95E1D3', 'activity'),
('اقتصاد', 'Economy', 'economy', '#FFD93D', 'trending-up'),
('ثقافة', 'Culture', 'culture', '#C7CEEA', 'book-open')
ON CONFLICT (slug) DO NOTHING;

-- إنشاء مستخدم تجريبي (كلمة المرور: admin123)
INSERT INTO users (email, password_hash, name, role, is_verified) VALUES
('admin@sabq.ai', '$2a$10$YourHashHere', 'مدير النظام', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- إعداد قاعدة بيانات Supabase لمنصة سبق الذكية
-- هذا الملف يجب تشغيله في Supabase SQL Editor

-- 1. إنشاء extension للبحث العربي
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. إنشاء إعدادات البحث العربي
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS arabic (COPY = simple);

-- 3. إنشاء فهارس البحث للمقالات
CREATE INDEX IF NOT EXISTS articles_title_content_idx ON articles 
USING GIN (to_tsvector('arabic', title || ' ' || content));

CREATE INDEX IF NOT EXISTS articles_slug_idx ON articles (slug);
CREATE INDEX IF NOT EXISTS articles_status_published_at_idx ON articles (status, published_at);
CREATE INDEX IF NOT EXISTS articles_author_id_idx ON articles (author_id);
CREATE INDEX IF NOT EXISTS articles_category_id_idx ON articles (category_id);

-- 4. فهارس للمستخدمين
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

-- 5. فهارس للتصنيفات
CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories (parent_id);

-- 6. فهارس للتفاعلات
CREATE INDEX IF NOT EXISTS interactions_user_article_type_idx ON interactions (user_id, article_id, type);
CREATE INDEX IF NOT EXISTS interactions_article_id_idx ON interactions (article_id);

-- 7. فهارس لسجلات الأنشطة
CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON activity_logs (user_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs (created_at);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx ON activity_logs (action);

-- 8. فهارس للكلمات المفتاحية
CREATE INDEX IF NOT EXISTS keywords_slug_idx ON keywords (slug);
CREATE INDEX IF NOT EXISTS keywords_name_idx ON keywords (name);

-- 9. فهارس لتفضيلات المستخدمين
CREATE INDEX IF NOT EXISTS user_preferences_user_key_idx ON user_preferences (user_id, key);

-- 10. فهارس للقوالب
CREATE INDEX IF NOT EXISTS templates_slug_idx ON templates (slug);
CREATE INDEX IF NOT EXISTS templates_category_idx ON templates (category);
CREATE INDEX IF NOT EXISTS templates_is_active_idx ON templates (is_active);

-- 11. فهارس للكتل الذكية
CREATE INDEX IF NOT EXISTS smart_blocks_type_idx ON smart_blocks (type);
CREATE INDEX IF NOT EXISTS smart_blocks_is_active_idx ON smart_blocks (is_active);

-- 12. فهارس لأعضاء الفريق
CREATE INDEX IF NOT EXISTS team_members_is_active_idx ON team_members (is_active);
CREATE INDEX IF NOT EXISTS team_members_department_idx ON team_members (department);

-- 13. فهارس لرموز التحقق
CREATE INDEX IF NOT EXISTS email_verification_codes_email_idx ON email_verification_codes (email);
CREATE INDEX IF NOT EXISTS email_verification_codes_code_idx ON email_verification_codes (code);
CREATE INDEX IF NOT EXISTS email_verification_codes_expires_at_idx ON email_verification_codes (expires_at);

-- 14. فهارس لرموز إعادة التعيين
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_token_idx ON password_reset_tokens (token);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx ON password_reset_tokens (expires_at);

-- 15. فهارس لإعدادات الصفحة الرئيسية
CREATE INDEX IF NOT EXISTS home_blocks_config_block_type_idx ON home_blocks_config (block_type);
CREATE INDEX IF NOT EXISTS home_blocks_config_display_order_idx ON home_blocks_config (display_order);
CREATE INDEX IF NOT EXISTS home_blocks_config_is_active_idx ON home_blocks_config (is_active);

-- 16. إنشاء view للتقارير السريعة
CREATE OR REPLACE VIEW articles_summary AS
SELECT 
  a.id,
  a.title,
  a.slug,
  a.status,
  a.views,
  a.created_at,
  a.published_at,
  c.name as category_name,
  c.slug as category_slug,
  u.name as author_name,
  u.email as author_email
FROM articles a
LEFT JOIN categories c ON a.category_id = c.id
LEFT JOIN users u ON a.author_id = u.id;

-- 17. إنشاء view لإحصائيات المستخدمين
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.created_at,
  COUNT(DISTINCT a.id) as articles_count,
  COUNT(DISTINCT i.id) as interactions_count,
  COUNT(DISTINCT al.id) as activities_count
FROM users u
LEFT JOIN articles a ON u.id = a.author_id
LEFT JOIN interactions i ON u.id = i.user_id
LEFT JOIN activity_logs al ON u.id = al.user_id
GROUP BY u.id, u.name, u.email, u.role, u.created_at;

-- 18. إنشاء function للبحث في المقالات
CREATE OR REPLACE FUNCTION search_articles(search_term TEXT)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  slug TEXT,
  status TEXT,
  views INTEGER,
  created_at TIMESTAMP,
  category_name TEXT,
  author_name TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.slug,
    a.status,
    a.views,
    a.created_at,
    c.name as category_name,
    u.name as author_name,
    ts_rank(to_tsvector('arabic', a.title || ' ' || a.content), plainto_tsquery('arabic', search_term)) as rank
  FROM articles a
  LEFT JOIN categories c ON a.category_id = c.id
  LEFT JOIN users u ON a.author_id = u.id
  WHERE 
    to_tsvector('arabic', a.title || ' ' || a.content) @@ plainto_tsquery('arabic', search_term)
    AND a.status = 'published'
  ORDER BY rank DESC, a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 19. إنشاء function لإحصائيات الموقع
CREATE OR REPLACE FUNCTION get_site_stats()
RETURNS TABLE (
  total_articles INTEGER,
  published_articles INTEGER,
  total_users INTEGER,
  total_categories INTEGER,
  total_views BIGINT,
  recent_activities INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM articles) as total_articles,
    (SELECT COUNT(*) FROM articles WHERE status = 'published') as published_articles,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM categories) as total_categories,
    (SELECT COALESCE(SUM(views), 0) FROM articles) as total_views,
    (SELECT COUNT(*) FROM activity_logs WHERE created_at > NOW() - INTERVAL '24 hours') as recent_activities;
END;
$$ LANGUAGE plpgsql;

-- 20. إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق trigger على الجداول الرئيسية
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 21. إنشاء سياسات الأمان (RLS)
-- تفعيل RLS على الجداول الرئيسية
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- سياسات للمستخدمين
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Admins can view all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- سياسات للمقالات
CREATE POLICY "Articles are viewable by everyone" ON articles
  FOR SELECT USING (true);

CREATE POLICY "Authors can edit own articles" ON articles
  FOR UPDATE USING (author_id = auth.uid()::text);

CREATE POLICY "Admins can edit all articles" ON articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- سياسات للتصنيفات
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- سياسات للتفاعلات
CREATE POLICY "Users can view own interactions" ON interactions
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own interactions" ON interactions
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- سياسات لسجلات الأنشطة
CREATE POLICY "Users can view own activities" ON activity_logs
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Admins can view all activities" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- 22. إنشاء بيانات أولية للاختبار
INSERT INTO categories (id, name, slug, description, display_order, is_active, created_at, updated_at)
VALUES 
  ('cat-default', 'عام', 'general', 'التصنيف الافتراضي', 0, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 23. إنشاء مستخدم admin افتراضي إذا لم يكن موجود
INSERT INTO users (id, email, name, role, is_admin, is_verified, created_at, updated_at)
VALUES 
  ('admin-default', 'admin@sabq.ai', 'مدير النظام', 'admin', true, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- رسالة نجاح
SELECT 'Supabase setup completed successfully!' as status; 