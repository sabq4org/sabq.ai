-- نظام القوالب الديناميكية
-- Dynamic Templates System

-- جدول القوالب الرئيسي
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- header, footer, sidebar, article, category, special
    content JSONB NOT NULL DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    
    -- إعدادات التفعيل
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    
    -- الجدولة الزمنية
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    
    -- الاستهداف
    country_code VARCHAR(2), -- SA, AE, KW, etc
    category_id INTEGER REFERENCES categories(id),
    
    -- إعدادات الشعار
    logo_url VARCHAR(500),
    logo_alt VARCHAR(255),
    logo_width INTEGER,
    logo_height INTEGER,
    
    -- الألوان والتصميم
    primary_color VARCHAR(7), -- #000000
    secondary_color VARCHAR(7),
    custom_styles TEXT,
    
    -- روابط التواصل الاجتماعي
    social_links JSONB DEFAULT '[]',
    
    -- البلوكات النشطة
    active_blocks JSONB DEFAULT '[]',
    
    -- التتبع
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- قيود
    CONSTRAINT unique_default_per_type UNIQUE NULLS NOT DISTINCT (type, is_default) WHERE is_default = true
);

-- فهرس للبحث السريع
CREATE INDEX idx_templates_type ON templates(type);
CREATE INDEX idx_templates_active ON templates(is_active);
CREATE INDEX idx_templates_schedule ON templates(starts_at, ends_at);
CREATE INDEX idx_templates_category ON templates(category_id);
CREATE INDEX idx_templates_country ON templates(country_code);

-- دالة للحصول على القالب النشط حسب السياق
CREATE OR REPLACE FUNCTION get_active_template(
    p_type VARCHAR,
    p_category_id INTEGER DEFAULT NULL,
    p_country_code VARCHAR DEFAULT NULL,
    p_current_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
) RETURNS TABLE (
    id INTEGER,
    name VARCHAR,
    content JSONB,
    settings JSONB,
    logo_url VARCHAR,
    logo_alt VARCHAR,
    logo_width INTEGER,
    logo_height INTEGER,
    primary_color VARCHAR,
    secondary_color VARCHAR,
    custom_styles TEXT,
    social_links JSONB,
    active_blocks JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.content,
        t.settings,
        t.logo_url,
        t.logo_alt,
        t.logo_width,
        t.logo_height,
        t.primary_color,
        t.secondary_color,
        t.custom_styles,
        t.social_links,
        t.active_blocks
    FROM templates t
    WHERE t.type = p_type
        AND t.is_active = true
        AND (t.starts_at IS NULL OR t.starts_at <= p_current_time)
        AND (t.ends_at IS NULL OR t.ends_at >= p_current_time)
        AND (t.category_id IS NULL OR t.category_id = p_category_id)
        AND (t.country_code IS NULL OR t.country_code = p_country_code)
    ORDER BY 
        -- الأولوية: تصنيف محدد > دولة محددة > افتراضي
        (t.category_id IS NOT NULL)::int DESC,
        (t.country_code IS NOT NULL)::int DESC,
        t.is_default DESC,
        t.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

-- جدول سجل المعاينات
CREATE TABLE IF NOT EXISTS template_previews (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
    preview_token VARCHAR(255) UNIQUE NOT NULL,
    preview_data JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- فهرس للمعاينات
CREATE INDEX idx_template_previews_token ON template_previews(preview_token);
CREATE INDEX idx_template_previews_expires ON template_previews(expires_at);

-- تنظيف المعاينات المنتهية
CREATE OR REPLACE FUNCTION cleanup_expired_previews()
RETURNS void AS $$
BEGIN
    DELETE FROM template_previews WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql; 