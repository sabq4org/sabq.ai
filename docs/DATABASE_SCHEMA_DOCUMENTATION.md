# توثيق قاعدة البيانات - Sabq AI CMS

**تاريخ الإنشاء:** `${new Date().toISOString().split('T')[0]}`  
**المطور:** Ali Alhazmi  
**الإصدار:** v1.0.0  
**قاعدة البيانات:** PostgreSQL + Supabase  

---

## نظرة عامة

منصة Sabq AI CMS تستخدم قاعدة بيانات PostgreSQL مع Supabase كخدمة مستضافة. التصميم يركز على الأمان والأداء والتوسعة مع دعم كامل للغة العربية.

## الجداول الأساسية

### 1. جدول المستخدمين (users)
```sql
-- الحقول الأساسية
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           TEXT UNIQUE NOT NULL -- مشفر
name            TEXT NOT NULL
phone           TEXT -- مشفر
password_hash   TEXT NOT NULL -- Argon2
role_id         UUID REFERENCES roles(id)
is_active       BOOLEAN DEFAULT true
email_verified  BOOLEAN DEFAULT false
created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
```

### 2. جدول الأدوار (roles)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            TEXT UNIQUE NOT NULL
description     TEXT
permissions     JSONB NOT NULL -- مصفوفة الصلاحيات
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
```

### 3. جدول المقالات (articles)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
title           TEXT NOT NULL
content         TEXT NOT NULL
excerpt         TEXT
slug            TEXT UNIQUE NOT NULL
author_id       UUID REFERENCES users(id)
section_id      UUID REFERENCES sections(id)
status          article_status DEFAULT 'draft'
views_count     INTEGER DEFAULT 0
is_featured     BOOLEAN DEFAULT false
published_at    TIMESTAMP WITH TIME ZONE
created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
```

### 4. جدول الأقسام (sections)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            TEXT NOT NULL
description     TEXT
slug            TEXT UNIQUE NOT NULL
color           TEXT DEFAULT '#3B82F6'
order_index     INTEGER DEFAULT 0
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
```

### 5. جدول الوسوم (tags)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            TEXT UNIQUE NOT NULL
slug            TEXT UNIQUE NOT NULL
description     TEXT
usage_count     INTEGER DEFAULT 0
created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
```

## العلاقات الرئيسية

### 1. article_tags (many-to-many)
```sql
article_id      UUID REFERENCES articles(id) ON DELETE CASCADE
tag_id          UUID REFERENCES tags(id) ON DELETE CASCADE
created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
PRIMARY KEY (article_id, tag_id)
```

### 2. user_preferences (تفضيلات المستخدم)
```sql
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
preferred_sections JSONB -- مصفوفة الأقسام المفضلة
notification_settings JSONB -- إعدادات الإشعارات
reading_preferences JSONB -- تفضيلات القراءة
created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
```

## جداول التحليل والإحصائيات

### 1. analytics_events (أحداث التحليل)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) -- اختياري
session_id      TEXT NOT NULL
event_type      event_type NOT NULL
event_data      JSONB NOT NULL
ip_address      TEXT -- مشفر
user_agent      TEXT
device_info     JSONB
geo_location    JSONB
created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
```

### 2. user_sessions (جلسات المستخدم)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
session_token   TEXT UNIQUE NOT NULL -- مشفر
ip_address      TEXT -- مشفر
user_agent      TEXT
device_info     JSONB
last_activity   TIMESTAMP WITH TIME ZONE DEFAULT now()
expires_at      TIMESTAMP WITH TIME ZONE NOT NULL
created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
```

## أنواع البيانات المخصصة

### 1. article_status
```sql
CREATE TYPE article_status AS ENUM (
    'draft',
    'published',
    'archived',
    'deleted'
);
```

### 2. event_type
```sql
CREATE TYPE event_type AS ENUM (
    'page_view',
    'article_read',
    'click',
    'scroll',
    'search',
    'login',
    'logout'
);
```

## الفهارس المهمة

### فهارس الأداء
```sql
-- فهرس البحث النصي العربي
CREATE INDEX idx_articles_search ON articles 
USING GIN (to_tsvector('arabic', title || ' ' || content));

-- فهرس التاريخ والحالة
CREATE INDEX idx_articles_published ON articles (published_at, status);

-- فهرس الأحداث بالوقت
CREATE INDEX idx_analytics_events_time ON analytics_events (created_at);

-- فهرس الجلسات النشطة
CREATE INDEX idx_user_sessions_active ON user_sessions (user_id, expires_at);
```

## وظائف قاعدة البيانات

### 1. تشفير البيانات الحساسة
```sql
-- وظيفة تشفير البيانات
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(encrypt(data::bytea, 'encryption_key', 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql;

-- وظيفة فك تشفير البيانات
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), 'encryption_key', 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql;
```

### 2. إدارة الجلسات
```sql
-- وظيفة تنظيف الجلسات المنتهية
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < now();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

## أمان قاعدة البيانات

### 1. Row Level Security (RLS)
```sql
-- تفعيل RLS لجدول المستخدمين
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- سياسة عرض البيانات الشخصية
CREATE POLICY users_own_data ON users
    FOR ALL USING (auth.uid() = id);

-- سياسة عرض المقالات المنشورة
CREATE POLICY articles_published ON articles
    FOR SELECT USING (status = 'published');
```

### 2. الأذونات
```sql
-- صلاحيات للمستخدمين العاديين
GRANT SELECT ON articles TO authenticated;
GRANT INSERT ON analytics_events TO authenticated;

-- صلاحيات للمشرفين
GRANT ALL ON articles TO admin_role;
GRANT ALL ON users TO admin_role;
```

## استراتيجية النسخ الاحتياطي

### 1. النسخ الاحتياطي التلقائي
- **النسخ اليومي**: نسخة كاملة من قاعدة البيانات يومياً
- **النسخ الإضافي**: كل 6 ساعات للبيانات الحساسة
- **الاحتفاظ**: 30 يوم للنسخ اليومية، 7 أيام للإضافية

### 2. ملفات النسخ الاحتياطي
```bash
# نسخة كاملة
pg_dump --clean --if-exists --create --format=custom \
  --file=backup_$(date +%Y%m%d_%H%M%S).sql sabq_ai_cms

# نسخة البيانات فقط
pg_dump --data-only --format=custom \
  --file=data_backup_$(date +%Y%m%d_%H%M%S).sql sabq_ai_cms
```

## المراقبة والصيانة

### 1. مراقبة الأداء
```sql
-- مراقبة الاستعلامات البطيئة
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;

-- مراقبة استخدام الفهارس
SELECT schemaname, tablename, indexname, idx_usage
FROM pg_stat_user_indexes
WHERE idx_usage < 100;
```

### 2. صيانة دورية
```sql
-- تحديث الإحصائيات
ANALYZE;

-- تنظيف الجداول
VACUUM ANALYZE;

-- إعادة فهرسة
REINDEX DATABASE sabq_ai_cms;
```

## أمثلة الاستعلامات

### 1. البحث في المقالات
```sql
-- البحث النصي العربي
SELECT id, title, excerpt, published_at
FROM articles
WHERE to_tsvector('arabic', title || ' ' || content) @@ plainto_tsquery('arabic', 'كلمة البحث')
  AND status = 'published'
ORDER BY published_at DESC;
```

### 2. إحصائيات المستخدم
```sql
-- إحصائيات قراءة المستخدم
SELECT 
    u.name,
    COUNT(ae.id) as total_events,
    COUNT(DISTINCT ae.session_id) as unique_sessions,
    MAX(ae.created_at) as last_activity
FROM users u
LEFT JOIN analytics_events ae ON u.id = ae.user_id
WHERE u.id = $1
GROUP BY u.id, u.name;
```

### 3. التوصيات الذكية
```sql
-- مقالات مشابهة
SELECT DISTINCT a2.id, a2.title, a2.excerpt
FROM articles a1
JOIN article_tags at1 ON a1.id = at1.article_id
JOIN article_tags at2 ON at1.tag_id = at2.tag_id
JOIN articles a2 ON at2.article_id = a2.id
WHERE a1.id = $1 AND a2.id != $1 AND a2.status = 'published'
ORDER BY a2.published_at DESC
LIMIT 5;
```

## التحسينات المستقبلية

### 1. تحسينات الأداء
- تنفيذ التخزين المؤقت للاستعلامات المتكررة
- استخدام Connection Pooling
- تحسين الفهارس بناءً على أنماط الاستخدام

### 2. الأمان المتقدم
- تنفيذ التشفير على مستوى الصف
- تسجيل مفصل لجميع العمليات
- مراقبة الأنشطة المشبوهة

### 3. التوسعة
- تنفيذ التقسيم الأفقي للجداول الكبيرة
- استخدام Read Replicas للاستعلامات
- تحسين التخزين للبيانات الأرشيفية

---

**آخر تحديث:** `${new Date().toISOString().split('T')[0]}`  
**المطور:** Ali Alhazmi  
**المراجعة:** معتمدة ✓ 