# طلب قاعدة بيانات لموقع سبق

## المتطلبات الأساسية

### 1. نوع قاعدة البيانات
- **الخيار الأول**: PostgreSQL 14.0 أو أحدث
- **الخيار الثاني**: MySQL 8.0 أو أحدث
- **متطلب أساسي**: دعم JSON fields

### 2. المواصفات التقنية
| المواصفة | القيمة المطلوبة |
|----------|----------------|
| المساحة | 10GB (قابلة للتوسع) |
| RAM مخصص | 2GB على الأقل |
| الاتصالات المتزامنة | 100 اتصال |
| معدل الاستعلامات | 1000 استعلام/ثانية |
| النسخ الاحتياطي | يومي تلقائي |
| الحماية | SSL/TLS إلزامي |

### 3. الصلاحيات المطلوبة
```sql
-- صلاحيات DDL
CREATE DATABASE
CREATE TABLE
ALTER TABLE
DROP TABLE
CREATE INDEX
CREATE VIEW

-- صلاحيات DML
SELECT
INSERT
UPDATE
DELETE

-- صلاحيات متقدمة
CREATE FUNCTION
CREATE PROCEDURE
CREATE TRIGGER
```

## الجداول المطلوبة

### 1. جدول المستخدمين (users)
```sql
- id (UUID)
- email (VARCHAR)
- password_hash (VARCHAR)
- name (VARCHAR)
- avatar (TEXT)
- role (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 2. جدول المقالات (articles)
```sql
- id (UUID)
- title (VARCHAR)
- slug (VARCHAR UNIQUE)
- content (TEXT)
- excerpt (TEXT)
- author_id (UUID)
- category_id (UUID)
- status (VARCHAR)
- views (INTEGER)
- featured_image (TEXT)
- metadata (JSONB)
- published_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 3. جدول التفاعلات (interactions)
```sql
- id (UUID)
- user_id (VARCHAR)
- article_id (UUID)
- type (VARCHAR) -- 'like', 'save', 'view'
- metadata (JSONB)
- created_at (TIMESTAMP)
```

### 4. جدول نقاط الولاء (loyalty_points)
```sql
- id (UUID)
- user_id (VARCHAR)
- points (INTEGER)
- action (VARCHAR)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

### 5. جدول التحليلات العميقة (deep_analyses)
```sql
- id (UUID)
- article_id (UUID)
- ai_summary (TEXT)
- key_points (JSONB)
- tags (JSONB)
- sentiment (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## بيانات الوصول المطلوبة

```env
# بيانات الاتصال
DATABASE_HOST=
DATABASE_PORT=
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=

# SSL (إن وجد)
DATABASE_SSL_CERT=

# معلومات إضافية
DATABASE_URL= # الرابط الكامل
DATABASE_POOL_MIN=
DATABASE_POOL_MAX=
```

## أدوات الإدارة المطلوبة

1. **واجهة ويب لإدارة قاعدة البيانات**:
   - phpMyAdmin (لـ MySQL)
   - pgAdmin (لـ PostgreSQL)
   - Adminer (يدعم الاثنين)

2. **الوصول عبر SSH** (اختياري):
   - للنسخ الاحتياطي اليدوي
   - لتنفيذ استعلامات مباشرة

3. **API endpoints** (إن أمكن):
   - REST API لإدارة قاعدة البيانات
   - Webhook للنسخ الاحتياطي

## الاستخدامات المتوقعة

1. **تخزين المحتوى**:
   - 10,000+ مقال
   - 100,000+ تعليق
   - 1,000,000+ تفاعل

2. **المستخدمون**:
   - 50,000+ مستخدم مسجل
   - 500+ مستخدم متزامن

3. **التحليلات**:
   - تتبع المشاهدات بالوقت الفعلي
   - تحليلات AI للمحتوى
   - إحصائيات مفصلة

## متطلبات الأداء

- **زمن الاستجابة**: < 100ms للاستعلامات البسيطة
- **التوفر**: 99.9% uptime
- **القابلية للتوسع**: إمكانية الترقية دون توقف

## الأمان والحماية

1. **التشفير**:
   - تشفير البيانات أثناء النقل (SSL/TLS)
   - تشفير البيانات المخزنة (اختياري)

2. **النسخ الاحتياطي**:
   - نسخ يومي تلقائي
   - الاحتفاظ بالنسخ لمدة 30 يوم
   - إمكانية الاستعادة الفورية

3. **الوصول**:
   - IP whitelisting
   - مصادقة قوية
   - سجلات الوصول

## معلومات الاتصال

في حالة الموافقة، أرجو تزويدي بـ:
1. بيانات الاتصال الكاملة
2. دليل الاستخدام
3. معلومات الدعم الفني
4. شروط الخدمة والأسعار

---

*ملاحظة: هذا المشروع لموقع إخباري احترافي يتطلب أداء عالي وموثوقية* 