-- إنشاء جدول user_interests
CREATE TABLE IF NOT EXISTS user_interests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    interest VARCHAR(100) NOT NULL,
    score FLOAT DEFAULT 1.0,
    source VARCHAR(50) DEFAULT 'explicit',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_interest (user_id, interest),
    INDEX idx_user_id (user_id),
    INDEX idx_interest (interest),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- إضافة بعض البيانات التجريبية للمستخدم التجريبي
INSERT INTO user_interests (user_id, interest, score, source) VALUES
('b9d1a4e8-3f2a-4c5b-8e7d-1f9a2b3c4d5e', 'technology', 1.0, 'onboarding'),
('b9d1a4e8-3f2a-4c5b-8e7d-1f9a2b3c4d5e', 'sports', 0.8, 'onboarding'),
('b9d1a4e8-3f2a-4c5b-8e7d-1f9a2b3c4d5e', 'politics', 0.6, 'onboarding')
ON DUPLICATE KEY UPDATE score = VALUES(score); 