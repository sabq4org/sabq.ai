-- إضافة جداول AI Comments المتوافقة مع Prisma Schema
-- تاريخ: 05/07/2024

-- جدول تحليل التعليقات بالذكاء الاصطناعي
CREATE TABLE IF NOT EXISTS ai_comment_analysis (
  id VARCHAR(36) NOT NULL DEFAULT (UUID()),
  comment_id VARCHAR(36) NOT NULL,
  score INT NOT NULL,
  classification VARCHAR(50) NOT NULL,
  suggested_action VARCHAR(20) NOT NULL,
  ai_provider VARCHAR(50),
  confidence DECIMAL(5,2),
  analysis_details JSON,
  flagged_words JSON,
  categories JSON,
  processing_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_comment (comment_id),
  INDEX idx_comment_id (comment_id),
  INDEX idx_classification (classification),
  INDEX idx_score (score),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_ai_analysis_comment 
    FOREIGN KEY (comment_id) 
    REFERENCES comments(id) 
    ON DELETE CASCADE
);

-- جدول إعدادات تحليل الذكاء الاصطناعي
CREATE TABLE IF NOT EXISTS ai_moderation_settings (
  id VARCHAR(36) NOT NULL DEFAULT (UUID()),
  auto_approve_threshold INT DEFAULT 80,
  auto_reject_threshold INT DEFAULT 20,
  enabled BOOLEAN DEFAULT TRUE,
  ai_provider VARCHAR(50) DEFAULT 'openai',
  api_key_encrypted TEXT,
  check_spam BOOLEAN DEFAULT TRUE,
  check_toxicity BOOLEAN DEFAULT TRUE,
  check_profanity BOOLEAN DEFAULT TRUE,
  check_threats BOOLEAN DEFAULT TRUE,
  check_identity_attack BOOLEAN DEFAULT TRUE,
  custom_rules JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- جدول سجل قرارات الذكاء الاصطناعي
CREATE TABLE IF NOT EXISTS ai_moderation_logs (
  id VARCHAR(36) NOT NULL DEFAULT (UUID()),
  comment_id VARCHAR(36) NOT NULL,
  ai_decision VARCHAR(20) NOT NULL,
  human_decision VARCHAR(20),
  overridden BOOLEAN DEFAULT FALSE,
  moderator_id VARCHAR(36),
  override_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_comment_log (comment_id),
  INDEX idx_overridden (overridden),
  CONSTRAINT fk_ai_log_comment 
    FOREIGN KEY (comment_id) 
    REFERENCES comments(id) 
    ON DELETE CASCADE
);

-- جدول الكلمات المحظورة
CREATE TABLE IF NOT EXISTS banned_words (
  id VARCHAR(36) NOT NULL DEFAULT (UUID()),
  word VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_word (word)
);

-- إضافة حقول AI لجدول التعليقات إذا لم تكن موجودة
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS ai_score INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_classification VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMP DEFAULT NULL;

-- إضافة فهارس للحقول الجديدة
ALTER TABLE comments 
ADD INDEX IF NOT EXISTS idx_ai_score (ai_score),
ADD INDEX IF NOT EXISTS idx_ai_classification (ai_classification);

-- إدراج إعدادات افتراضية
INSERT IGNORE INTO ai_moderation_settings (
  id,
  auto_approve_threshold,
  auto_reject_threshold,
  enabled,
  ai_provider
) VALUES (
  UUID(),
  80,
  20,
  TRUE,
  'openai'
);

-- إدراج بعض الكلمات المحظورة الافتراضية
INSERT IGNORE INTO banned_words (word, severity) VALUES
('spam', 'low'),
('advertisement', 'low'),
('offensive_word1', 'high'),
('offensive_word2', 'high'),
('suspicious_word1', 'medium'),
('suspicious_word2', 'medium');

-- عرض لإحصائيات دقة الذكاء الاصطناعي
CREATE OR REPLACE VIEW ai_moderation_accuracy AS
SELECT 
  COUNT(*) as total_decisions,
  SUM(CASE WHEN overridden = TRUE THEN 1 ELSE 0 END) as overridden_count,
  ROUND((SUM(CASE WHEN overridden = FALSE THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as accuracy_percentage,
  ai_decision,
  DATE(created_at) as date
FROM ai_moderation_logs
GROUP BY ai_decision, DATE(created_at)
ORDER BY date DESC; 