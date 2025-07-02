-- قاعدة بيانات صفحة استعراض الخبر - صحيفة سبق
-- تم إنشاؤها باستخدام تصميم جُرعة

-- جدول إصدارات المقالات
CREATE TABLE article_versions (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL,
    version_number VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    title VARCHAR(500) NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft',
    is_current BOOLEAN DEFAULT FALSE
);

-- جدول سجل التغييرات
CREATE TABLE article_logs (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(100) NOT NULL,
    action_description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول تنبيهات الذكاء الاصطناعي
CREATE TABLE article_ai_flags (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL,
    flag_type VARCHAR(50) NOT NULL,
    flag_level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- بيانات تجريبية
INSERT INTO article_logs (article_id, action_type, user_id, user_name, user_role, action_description) VALUES
(1, 'created', 1, 'علي الحازمي', 'مراسل', 'تم إنشاء المقال الأول حول الطاقة المتجددة'),
(1, 'published', 3, 'خالد البكيري', 'رئيس التحرير', 'تم نشر المقال على الموقع');