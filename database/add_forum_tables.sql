-- جداول منتدى سبق الجديد
-- تم إنشاؤها بتاريخ 2025-01-25

-- جدول فئات المنتدى
CREATE TABLE IF NOT EXISTS forum_categories (
    id VARCHAR(191) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_order (display_order)
);

-- جدول المواضيع
CREATE TABLE IF NOT EXISTS forum_topics (
    id VARCHAR(191) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(191) NOT NULL,
    category_id VARCHAR(191) NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    status ENUM('active', 'pending', 'hidden', 'deleted') DEFAULT 'active',
    views INT DEFAULT 0,
    last_reply_at DATETIME,
    last_reply_by VARCHAR(191),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES forum_categories(id),
    FOREIGN KEY (last_reply_by) REFERENCES users(id),
    INDEX idx_category (category_id),
    INDEX idx_author (author_id),
    INDEX idx_status_created (status, created_at),
    INDEX idx_last_reply (last_reply_at)
);

-- جدول الردود
CREATE TABLE IF NOT EXISTS forum_replies (
    id VARCHAR(191) PRIMARY KEY DEFAULT (UUID()),
    topic_id VARCHAR(191) NOT NULL,
    parent_id VARCHAR(191), -- للردود المتداخلة
    author_id VARCHAR(191) NOT NULL,
    content TEXT NOT NULL,
    is_accepted BOOLEAN DEFAULT false, -- للحلول المقبولة
    status ENUM('active', 'pending', 'hidden', 'deleted') DEFAULT 'active',
    edited_at DATETIME,
    edited_by VARCHAR(191),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES forum_replies(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (edited_by) REFERENCES users(id),
    INDEX idx_topic (topic_id),
    INDEX idx_author (author_id),
    INDEX idx_created (created_at)
);

-- جدول التصويتات (likes/dislikes)
CREATE TABLE IF NOT EXISTS forum_votes (
    id VARCHAR(191) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(191) NOT NULL,
    target_type ENUM('topic', 'reply') NOT NULL,
    target_id VARCHAR(191) NOT NULL,
    vote_type ENUM('like', 'dislike') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_vote (user_id, target_type, target_id),
    INDEX idx_target (target_type, target_id)
);

-- جدول الأوسمة
CREATE TABLE IF NOT EXISTS forum_badges (
    id VARCHAR(191) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50),
    requirements JSON, -- شروط الحصول على الوسام
    points INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول أوسمة المستخدمين
CREATE TABLE IF NOT EXISTS forum_user_badges (
    id VARCHAR(191) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(191) NOT NULL,
    badge_id VARCHAR(191) NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (badge_id) REFERENCES forum_badges(id),
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user (user_id)
);

-- جدول نقاط السمعة
CREATE TABLE IF NOT EXISTS forum_reputation (
    id VARCHAR(191) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(191) NOT NULL,
    points INT DEFAULT 0,
    action_type VARCHAR(50) NOT NULL, -- 'topic_created', 'reply_posted', 'reply_accepted', etc
    target_type VARCHAR(50),
    target_id VARCHAR(191),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
);

-- جدول المتابعة
CREATE TABLE IF NOT EXISTS forum_follows (
    id VARCHAR(191) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(191) NOT NULL,
    target_type ENUM('topic', 'user', 'category') NOT NULL,
    target_id VARCHAR(191) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_follow (user_id, target_type, target_id),
    INDEX idx_user (user_id),
    INDEX idx_target (target_type, target_id)
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS forum_notifications (
    id VARCHAR(191) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(191) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'reply', 'mention', 'badge_earned', etc
    target_type VARCHAR(50),
    target_id VARCHAR(191),
    data JSON,
    is_read BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_unread (user_id, is_read),
    INDEX idx_created (created_at)
);

-- جدول التقارير
CREATE TABLE IF NOT EXISTS forum_reports (
    id VARCHAR(191) PRIMARY KEY DEFAULT (UUID()),
    reporter_id VARCHAR(191) NOT NULL,
    target_type ENUM('topic', 'reply') NOT NULL,
    target_id VARCHAR(191) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'resolved', 'dismissed') DEFAULT 'pending',
    resolved_by VARCHAR(191),
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_target (target_type, target_id)
);

-- إدخال بعض الفئات الافتراضية
INSERT INTO forum_categories (name, name_ar, slug, description, icon, color, display_order) VALUES
('General Discussion', 'نقاش عام', 'general', 'نقاشات عامة حول منصة سبق', '💬', 'bg-blue-500', 1),
('Feature Requests', 'اقتراحات', 'requests', 'اقترح مميزات جديدة', '💡', 'bg-purple-500', 2),
('Bug Reports', 'مشاكل تقنية', 'bugs', 'أبلغ عن مشاكل تقنية', '🐛', 'bg-red-500', 3),
('Help & Support', 'مساعدة', 'help', 'احصل على مساعدة من المجتمع', '🆘', 'bg-green-500', 4),
('Announcements', 'إعلانات', 'announcements', 'آخر الأخبار والتحديثات', '📢', 'bg-yellow-500', 5);

-- إدخال بعض الأوسمة الافتراضية
INSERT INTO forum_badges (name, name_ar, description, icon, color, requirements, points) VALUES
('Founding Member', 'عضو مؤسس', 'انضم للمنتدى في أول 100 عضو', '🏆', 'bg-yellow-500', '{"type": "early_member", "limit": 100}', 100),
('Top Contributor', 'محرر متميز', 'كتب أكثر من 100 موضوع مفيد', '✍️', 'bg-blue-500', '{"type": "topic_count", "count": 100}', 200),
('Problem Solver', 'خبير حلول', 'قدم 50 حل لمشاكل الأعضاء', '💡', 'bg-green-500', '{"type": "accepted_replies", "count": 50}', 150),
('Active Member', 'مشارك نشط', 'نشط لمدة 30 يوم متتالية', '🔥', 'bg-orange-500', '{"type": "consecutive_days", "days": 30}', 50); 