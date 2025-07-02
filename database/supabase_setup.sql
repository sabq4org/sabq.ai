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