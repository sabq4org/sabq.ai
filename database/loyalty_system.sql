-- ===========================================
-- نظام نقاط الولاء لصحيفة سبق
-- Loyalty Points System Schema
-- ===========================================

-- جدول التفاعلات مع المقالات
CREATE TABLE user_article_interactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    article_id INT NOT NULL,
    interaction_type ENUM('read', 'like', 'share', 'comment', 'bookmark') NOT NULL,
    interaction_data JSON, -- بيانات إضافية (مدة القراءة، منصة المشاركة، إلخ)
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_article (user_id, article_id),
    INDEX idx_interaction_type (interaction_type),
    INDEX idx_created_at (created_at)
);

-- جدول نقاط الولاء
CREATE TABLE loyalty_points (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL, -- READ, SHARE, COMMENT, LIKE, BONUS, REFERRAL
    points INT NOT NULL,
    source_type ENUM('article', 'comment', 'share', 'referral', 'bonus', 'campaign') NOT NULL,
    source_id INT, -- رقم المقال أو التعليق أو المصدر
    description TEXT, -- وصف للنشاط
    metadata JSON, -- بيانات إضافية
    is_valid BOOLEAN DEFAULT TRUE, -- للسماح بإلغاء النقاط إذا لزم الأمر
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL, -- انتهاء صلاحية النقاط (اختياري)
    
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_source (source_type, source_id),
    INDEX idx_created_at (created_at),
    INDEX idx_valid (is_valid)
);

-- جدول إجمالي النقاط للمستخدمين
CREATE TABLE user_loyalty_summary (
    user_id INT PRIMARY KEY,
    total_points INT DEFAULT 0,
    total_earned INT DEFAULT 0, -- إجمالي ما حصل عليه
    total_spent INT DEFAULT 0,  -- إجمالي ما أنفقه
    current_level VARCHAR(20) DEFAULT 'Bronze', -- Bronze, Silver, Gold, Platinum
    points_this_month INT DEFAULT 0,
    points_this_week INT DEFAULT 0,
    last_activity_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_total_points (total_points),
    INDEX idx_level (current_level),
    INDEX idx_last_activity (last_activity_at)
);

-- جدول قواعد احتساب النقاط (حسب الجدول المطلوب)
CREATE TABLE loyalty_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(50) NOT NULL UNIQUE,
    action VARCHAR(50) NOT NULL,
    points INT NOT NULL,
    conditions JSON, -- شروط الاحتساب
    max_per_day INT DEFAULT NULL, -- الحد الأقصى يومياً
    max_per_article INT DEFAULT NULL, -- الحد الأقصى لكل مقال
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- إدراج القواعد الأساسية حسب الجدول المطلوب
INSERT INTO loyalty_rules (rule_name, action, points, conditions, max_per_day, max_per_article) VALUES
('read_article', 'READ', 2, '{"min_duration": 30}', NULL, 1),
('long_reading', 'READ_LONG', 3, '{"min_duration": 60}', 50, NULL),
('share_article', 'SHARE', 5, '{}', 10, 1),
('like_article', 'LIKE', 1, '{}', 20, 1),
('comment_article', 'COMMENT', 4, '{}', 10, 1),
('reading_streak', 'BONUS_STREAK', 10, '{"consecutive_articles": 5}', 1, NULL),
('push_notification_open', 'NOTIFICATION_OPEN', 2, '{}', 5, 1),
('referral_signup', 'REFERRAL', 20, '{"verified_email": true}', NULL, NULL);

-- جدول تتبع الجلسات للمكافآت المتتالية
CREATE TABLE user_reading_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id VARCHAR(36) NOT NULL, -- UUID
    articles_read INT DEFAULT 0,
    total_duration INT DEFAULT 0, -- بالثواني
    bonus_awarded BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_session (user_id, session_id),
    INDEX idx_last_activity (last_activity_at)
);

-- جدول المستويات (Bronze, Silver, Gold, Platinum)
CREATE TABLE loyalty_levels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level_name VARCHAR(20) NOT NULL UNIQUE,
    min_points INT NOT NULL,
    max_points INT,
    badge_color VARCHAR(7), -- HEX color
    benefits JSON, -- مزايا هذا المستوى
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إدراج المستويات الافتراضية
INSERT INTO loyalty_levels (level_name, min_points, max_points, badge_color, benefits) VALUES
('Bronze', 0, 99, '#CD7F32', '{"description": "مستوى البرونز", "perks": ["نقاط أساسية"]}'),
('Silver', 100, 499, '#C0C0C0', '{"description": "مستوى الفضة", "perks": ["نقاط مضاعفة", "وصول مبكر"]}'),
('Gold', 500, 999, '#FFD700', '{"description": "مستوى الذهب", "perks": ["نقاط مضاعفة x2", "محتوى حصري"]}'),
('Platinum', 1000, NULL, '#E5E4E2', '{"description": "مستوى البلاتين", "perks": ["نقاط مضاعفة x3", "محتوى VIP", "هدايا شهرية"]}');

-- ===========================================
-- View لإحصائيات المستخدم
-- ===========================================
CREATE VIEW user_loyalty_stats AS
SELECT 
    u.user_id,
    u.total_points,
    u.current_level,
    ll.badge_color,
    ll.benefits,
    COUNT(DISTINCT DATE(lp.created_at)) as active_days,
    COUNT(lp.id) as total_transactions
FROM user_loyalty_summary u
LEFT JOIN loyalty_levels ll ON u.current_level = ll.level_name
LEFT JOIN loyalty_points lp ON u.user_id = lp.user_id AND lp.is_valid = TRUE
GROUP BY u.user_id;
