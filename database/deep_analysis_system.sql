-- نظام التحليل العميق لصحيفة سبق
-- Deep Analysis System for Sabq

-- جدول التحليلات العميقة الرئيسي
CREATE TABLE deep_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- البيانات الأساسية
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    summary TEXT NOT NULL,
    content JSONB NOT NULL, -- محتوى منسق بـ JSON
    raw_content TEXT, -- المحتوى الخام
    
    -- التصنيفات والوسوم
    categories JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    
    -- معلومات الإنشاء
    author_id UUID REFERENCES users(id),
    author_name VARCHAR(255),
    source_type VARCHAR(50) CHECK (source_type IN ('manual', 'gpt', 'hybrid')) DEFAULT 'manual',
    creation_type VARCHAR(50) CHECK (creation_type IN ('from_article', 'new', 'external_link', 'category_based')),
    source_article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    external_link TEXT,
    
    -- معلومات الجودة والقراءة
    reading_time INTEGER DEFAULT 5, -- بالدقائق
    quality_score DECIMAL(3,2) DEFAULT 0.00, -- من 0 إلى 1
    content_score JSONB DEFAULT '{}', -- تفاصيل التقييم
    
    -- إعدادات النشر
    status VARCHAR(50) CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    display_position VARCHAR(50) CHECK (display_position IN ('top', 'middle', 'custom_block', 'sidebar')) DEFAULT 'middle',
    
    -- الإحصائيات
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    avg_read_time INTEGER DEFAULT 0, -- بالثواني
    
    -- التواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    last_gpt_update TIMESTAMP WITH TIME ZONE,
    
    -- بيانات إضافية
    metadata JSONB DEFAULT '{}'
);

-- جدول سجلات GPT
CREATE TABLE gpt_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES deep_analyses(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT,
    model VARCHAR(50) DEFAULT 'gpt-4',
    tokens_used INTEGER,
    cost DECIMAL(10,4),
    status VARCHAR(50) CHECK (status IN ('pending', 'success', 'failed', 'timeout')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- جدول التفاعلات مع التحليلات
CREATE TABLE deep_analysis_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES deep_analyses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    interaction_type VARCHAR(50) CHECK (interaction_type IN ('view', 'like', 'share', 'save', 'comment')),
    duration INTEGER, -- للقراءة بالثواني
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- جدول التعليقات على التحليلات
CREATE TABLE deep_analysis_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES deep_analyses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    parent_id UUID REFERENCES deep_analysis_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول إعدادات GPT
CREATE TABLE gpt_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key TEXT NOT NULL,
    model VARCHAR(50) DEFAULT 'gpt-4',
    max_tokens INTEGER DEFAULT 4000,
    temperature DECIMAL(2,1) DEFAULT 0.7,
    rate_limit INTEGER DEFAULT 10, -- طلبات في الدقيقة
    monthly_budget DECIMAL(10,2) DEFAULT 100.00,
    current_usage DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- الفهارس
CREATE INDEX idx_deep_analyses_status ON deep_analyses(status);
CREATE INDEX idx_deep_analyses_published_at ON deep_analyses(published_at DESC);
CREATE INDEX idx_deep_analyses_source_type ON deep_analyses(source_type);
CREATE INDEX idx_deep_analyses_is_featured ON deep_analyses(is_featured);
CREATE INDEX idx_deep_analyses_categories ON deep_analyses USING GIN(categories);
CREATE INDEX idx_deep_analyses_tags ON deep_analyses USING GIN(tags);
CREATE INDEX idx_deep_analyses_quality_score ON deep_analyses(quality_score DESC);

-- الدوال المساعدة

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الدالة على الجداول
CREATE TRIGGER update_deep_analyses_updated_at BEFORE UPDATE ON deep_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gpt_settings_updated_at BEFORE UPDATE ON gpt_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- دالة لحساب جودة المحتوى
CREATE OR REPLACE FUNCTION calculate_content_quality(
    content_length INTEGER,
    has_sections BOOLEAN,
    has_data BOOLEAN,
    has_recommendations BOOLEAN
) RETURNS DECIMAL AS $$
DECLARE
    score DECIMAL := 0.0;
BEGIN
    -- طول المحتوى (25%)
    IF content_length > 2000 THEN
        score := score + 0.25;
    ELSIF content_length > 1000 THEN
        score := score + 0.15;
    ELSIF content_length > 500 THEN
        score := score + 0.10;
    END IF;
    
    -- وجود أقسام (25%)
    IF has_sections THEN
        score := score + 0.25;
    END IF;
    
    -- وجود بيانات (25%)
    IF has_data THEN
        score := score + 0.25;
    END IF;
    
    -- وجود توصيات (25%)
    IF has_recommendations THEN
        score := score + 0.25;
    END IF;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- دالة لتوليد slug تلقائياً
CREATE OR REPLACE FUNCTION generate_analysis_slug(title TEXT) RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- تحويل العنوان إلى slug
    base_slug := LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9\u0600-\u06FF]+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- إضافة timestamp
    final_slug := base_slug || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    
    -- التحقق من التكرار
    WHILE EXISTS (SELECT 1 FROM deep_analyses WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- نماذج البيانات الأولية

-- إدراج إعدادات GPT الافتراضية
INSERT INTO gpt_settings (api_key, model, max_tokens, temperature, rate_limit, monthly_budget)
VALUES ('sk-...', 'gpt-4', 4000, 0.7, 10, 100.00);

-- صلاحيات
GRANT ALL ON deep_analyses TO authenticated;
GRANT ALL ON gpt_analysis_logs TO authenticated;
GRANT ALL ON deep_analysis_interactions TO authenticated;
GRANT ALL ON deep_analysis_comments TO authenticated;
GRANT SELECT ON gpt_settings TO authenticated;
GRANT ALL ON gpt_settings TO service_role; 