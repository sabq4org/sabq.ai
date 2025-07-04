-- إضافة الحقول الجديدة لجدول التصنيفات
-- هذا السكريبت يضيف دعم اللغات المتعددة والألوان والأيقونات

-- إضافة حقل الاسم بالعربية
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255) AFTER name;

-- إضافة حقل الاسم بالإنجليزية
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255) AFTER name_ar;

-- إضافة حقل اللون (Hex)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS color_hex VARCHAR(7) DEFAULT '#3B82F6' AFTER description;

-- إضافة حقل الأيقونة (Emoji)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '📁' AFTER color_hex;

-- نسخ القيم الحالية من حقل name إلى name_ar كقيمة افتراضية
UPDATE categories 
SET name_ar = name 
WHERE name_ar IS NULL;

-- تحديث الفهارس
ALTER TABLE categories 
ADD INDEX idx_name_ar (name_ar);

-- عرض البنية الجديدة
DESCRIBE categories; 