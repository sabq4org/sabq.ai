-- إضافة جدول تحليل التعليقات بالذكاء الاصطناعي
CREATE TABLE IF NOT EXISTS ai_comment_analysis (
  id VARCHAR(36) NOT NULL DEFAULT (UUID()),
  comment_id VARCHAR(36) NOT NULL,
  score INT NOT NULL, -- نسبة الأمان (0-100)
  classification VARCHAR(50) NOT NULL, -- toxic, spam, safe, suspicious
  suggested_action VARCHAR(20) NOT NULL, -- approve, reject, review
  ai_provider VARCHAR(50), -- openai, perspective, huggingface
  confidence DECIMAL(5,2), -- مستوى الثقة في التحليل
  analysis_details JSON, -- تفاصيل التحليل الكاملة
  flagged_words JSON, -- الكلمات المشبوهة
  categories JSON, -- تصنيفات متعددة (عنف، تحرش، إلخ)
  processing_time INT, -- وقت المعالجة بالميلي ثانية
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_comment_id (comment_id),
  INDEX idx_classification (classification),
  INDEX idx_score (score),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_ai_analysis_comment 
    FOREIGN KEY (comment_id) 
    REFERENCES comments(id) 
    ON DELETE CASCADE
);

-- إضافة حقول الذكاء الاصطناعي لجدول التعليقات
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS ai_score INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_classification VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMP DEFAULT NULL,
ADD INDEX idx_ai_score (ai_score),
ADD INDEX idx_ai_classification (ai_classification);

-- جدول إعدادات تحليل الذكاء الاصطناعي
CREATE TABLE IF NOT EXISTS ai_moderation_settings (
  id VARCHAR(36) NOT NULL DEFAULT (UUID()),
  auto_approve_threshold INT DEFAULT 80, -- عتبة الموافقة التلقائية
  auto_reject_threshold INT DEFAULT 20, -- عتبة الرفض التلقائي
  enabled BOOLEAN DEFAULT TRUE,
  ai_provider VARCHAR(50) DEFAULT 'openai',
  api_key_encrypted TEXT, -- مفتاح API مشفر
  check_spam BOOLEAN DEFAULT TRUE,
  check_toxicity BOOLEAN DEFAULT TRUE,
  check_profanity BOOLEAN DEFAULT TRUE,
  check_threats BOOLEAN DEFAULT TRUE,
  check_identity_attack BOOLEAN DEFAULT TRUE,
  custom_rules JSON, -- قواعد مخصصة
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- جدول سجل قرارات الذكاء الاصطناعي
CREATE TABLE IF NOT EXISTS ai_moderation_logs (
  id VARCHAR(36) NOT NULL DEFAULT (UUID()),
  comment_id VARCHAR(36) NOT NULL,
  ai_decision VARCHAR(20) NOT NULL, -- approve, reject, review
  human_decision VARCHAR(20), -- approve, reject, edit
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

-- إدراج إعدادات افتراضية
INSERT INTO ai_moderation_settings (
  auto_approve_threshold,
  auto_reject_threshold,
  enabled,
  ai_provider
) VALUES (
  80,
  20,
  TRUE,
  'openai'
);

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