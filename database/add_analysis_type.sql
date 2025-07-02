-- إضافة enum للأنواع
CREATE TYPE analysis_type AS ENUM ('manual', 'ai', 'mixed');

-- إضافة حقل analysis_type لجدول deep_analyses
ALTER TABLE deep_analyses 
ADD COLUMN IF NOT EXISTS analysis_type analysis_type DEFAULT 'manual';

-- إضافة فهرس للحقل الجديد
CREATE INDEX IF NOT EXISTS idx_deep_analyses_analysis_type ON deep_analyses(analysis_type);

-- تحديث السجلات الموجودة بناءً على البيانات
UPDATE deep_analyses 
SET analysis_type = CASE 
    WHEN ai_summary IS NOT NULL AND metadata IS NOT NULL THEN 'mixed'
    WHEN ai_summary IS NOT NULL THEN 'ai'
    ELSE 'manual'
END
WHERE analysis_type IS NULL; 