# دليل إعداد قاعدة البيانات - سبق الذكية CMS

## 🗄️ نظرة عامة

يستخدم مشروع **سبق الذكية CMS** قاعدة بيانات PostgreSQL مع Prisma ORM لإدارة البيانات. هذا الدليل يوضح كيفية إعداد وتكوين قاعدة البيانات بالكامل.

## 📋 المتطلبات الأساسية

### قاعدة البيانات
- PostgreSQL 14+ (مستحسن)
- حد أدنى 2GB مساحة قرص
- 4GB RAM للأداء الأمثل

### أدوات التطوير
- Node.js 18+
- npm أو yarn
- Prisma CLI

## 🚀 خطوات الإعداد السريع

### 1. تثبيت PostgreSQL

#### على macOS (باستخدام Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### على Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install postgresql-14 postgresql-contrib-14
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### على Windows:
1. تحميل PostgreSQL من [الموقع الرسمي](https://www.postgresql.org/download/windows/)
2. تشغيل المثبت واتباع التعليمات
3. تشغيل pgAdmin لإدارة قاعدة البيانات

### 2. إنشاء قاعدة البيانات

```bash
# الدخول إلى PostgreSQL
sudo -u postgres psql

# إنشاء المستخدم
CREATE USER sabq_admin WITH PASSWORD 'secure_password_here';

# إنشاء قاعدة البيانات الرئيسية
CREATE DATABASE sabq_ai_cms OWNER sabq_admin;

# إنشاء قاعدة البيانات للاختبار
CREATE DATABASE sabq_ai_cms_test OWNER sabq_admin;

# إعطاء الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE sabq_ai_cms TO sabq_admin;
GRANT ALL PRIVILEGES ON DATABASE sabq_ai_cms_test TO sabq_admin;

# الخروج من psql
\q
```

### 3. تكوين متغيرات البيئة

```env
# ملف .env.local
DATABASE_URL="postgresql://sabq_admin:secure_password_here@localhost:5432/sabq_ai_cms?schema=public"
DATABASE_TEST_URL="postgresql://sabq_admin:secure_password_here@localhost:5432/sabq_ai_cms_test?schema=public"
```

### 4. تثبيت وتشغيل Prisma

```bash
# تثبيت Prisma CLI
npm install -g prisma

# تثبيت Prisma Client
npm install prisma @prisma/client

# إنشاء قاعدة البيانات من المخطط
npx prisma migrate dev --name init

# إدخال البيانات الأولية
npx prisma db seed
```

## 📊 مخطط قاعدة البيانات

### الجداول الأساسية

#### المستخدمون والأدوار
```sql
-- جدول المستخدمين
users (
  id: UUID PRIMARY KEY
  email: VARCHAR UNIQUE
  hashed_password: VARCHAR
  name: VARCHAR
  phone: VARCHAR
  status: ENUM (ACTIVE, INACTIVE, SUSPENDED, BANNED)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)

-- جدول الأدوار
roles (
  id: UUID PRIMARY KEY
  name: VARCHAR UNIQUE
  permissions: JSON
)

-- جدول ربط المستخدمين بالأدوار
user_roles (
  user_id: UUID REFERENCES users(id)
  role_id: UUID REFERENCES roles(id)
  PRIMARY KEY (user_id, role_id)
)
```

#### المحتوى والمقالات
```sql
-- جدول الأقسام
sections (
  id: UUID PRIMARY KEY
  name: VARCHAR UNIQUE
  description: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)

-- جدول المقالات
articles (
  id: UUID PRIMARY KEY
  title: VARCHAR
  slug: VARCHAR UNIQUE
  summary: TEXT
  content: TEXT
  author_id: UUID REFERENCES users(id)
  section_id: UUID REFERENCES sections(id)
  status: ENUM (DRAFT, PUBLISHED, ARCHIVED, DELETED)
  published_at: TIMESTAMP
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)

-- جدول الوسوم
tags (
  id: UUID PRIMARY KEY
  name: VARCHAR UNIQUE
  created_at: TIMESTAMP
)

-- جدول ربط المقالات بالوسوم
article_tags (
  article_id: UUID REFERENCES articles(id)
  tag_id: UUID REFERENCES tags(id)
  PRIMARY KEY (article_id, tag_id)
)
```

#### الوسائط والتفاعل
```sql
-- جدول وسائط المقالات
article_media (
  id: UUID PRIMARY KEY
  article_id: UUID REFERENCES articles(id)
  media_type: ENUM (IMAGE, VIDEO, AUDIO, DOCUMENT)
  url: VARCHAR
  metadata: JSON
  created_at: TIMESTAMP
)

-- جدول التعليقات
article_comments (
  id: UUID PRIMARY KEY
  article_id: UUID REFERENCES articles(id)
  user_id: UUID REFERENCES users(id)
  content: TEXT
  status: ENUM (PENDING, APPROVED, REJECTED, SPAM)
  parent_id: UUID REFERENCES article_comments(id)
  created_at: TIMESTAMP
)
```

#### التحليلات والإحصائيات
```sql
-- جدول أحداث التحليلات
article_analytics_events (
  id: UUID PRIMARY KEY
  article_id: UUID REFERENCES articles(id)
  user_id: UUID REFERENCES users(id)
  session_id: UUID REFERENCES sessions(id)
  event_type: ENUM (PAGE_VIEW, SCROLL, CLICK, READING_TIME, LIKE, SHARE, COMMENT, BOOKMARK, SEARCH)
  event_data: JSON
  created_at: TIMESTAMP
)

-- جدول التوصيات
recommendations (
  id: UUID PRIMARY KEY
  user_id: UUID REFERENCES users(id)
  article_id: UUID REFERENCES articles(id)
  score: FLOAT
  reason: JSON
  recommended_at: TIMESTAMP
)
```

#### النظام والتكاملات
```sql
-- جدول التكاملات
integrations (
  id: UUID PRIMARY KEY
  name: VARCHAR UNIQUE
  type: ENUM (CDN, STORAGE, PAYMENT, ANALYTICS, EMAIL, SMS, SOCIAL, AI, SECURITY)
  config: JSON
  status: ENUM (ACTIVE, INACTIVE, ERROR, MAINTENANCE)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)

-- جدول سجل تغييرات التكاملات
integrations_change_log (
  id: UUID PRIMARY KEY
  integration_id: UUID REFERENCES integrations(id)
  changed_by: UUID REFERENCES users(id)
  change_type: VARCHAR
  old_value: JSON
  new_value: JSON
  summary: TEXT
  created_at: TIMESTAMP
)
```

## 🔧 عمليات الصيانة

### النسخ الاحتياطي

#### نسخ احتياطي يدوي:
```bash
# نسخ احتياطي للبيانات
pg_dump -U sabq_admin -h localhost sabq_ai_cms > backup_$(date +%Y%m%d_%H%M%S).sql

# نسخ احتياطي مضغوط
pg_dump -U sabq_admin -h localhost -Fc sabq_ai_cms > backup_$(date +%Y%m%d_%H%M%S).dump
```

#### نسخ احتياطي تلقائي (cron):
```bash
# إضافة إلى crontab
crontab -e

# نسخ احتياطي يومي في 2:00 صباحاً
0 2 * * * pg_dump -U sabq_admin sabq_ai_cms > /backups/daily_$(date +\%Y\%m\%d).sql

# نسخ احتياطي أسبوعي
0 2 * * 0 pg_dump -U sabq_admin -Fc sabq_ai_cms > /backups/weekly_$(date +\%Y\%m\%d).dump
```

### الاستعادة

```bash
# استعادة من ملف SQL
psql -U sabq_admin -h localhost sabq_ai_cms < backup_20240101_120000.sql

# استعادة من ملف dump
pg_restore -U sabq_admin -h localhost -d sabq_ai_cms backup_20240101_120000.dump
```

### تحسين الأداء

#### فهرسة الجداول:
```sql
-- فهارس للأداء
CREATE INDEX idx_articles_status_published ON articles(status, published_at);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_section ON articles(section_id);
CREATE INDEX idx_analytics_article_created ON article_analytics_events(article_id, created_at);
CREATE INDEX idx_comments_article ON article_comments(article_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_token ON sessions(token);
```

#### إحصائيات قاعدة البيانات:
```sql
-- تحديث إحصائيات الجداول
ANALYZE;

-- فحص استخدام الفهارس
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- فحص حجم الجداول
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

## 🔍 مراقبة الأداء

### استعلامات مفيدة للمراقبة

#### الاتصالات النشطة:
```sql
SELECT 
    pid, 
    usename, 
    application_name, 
    client_addr, 
    state, 
    query_start,
    query
FROM pg_stat_activity 
WHERE state = 'active';
```

#### الاستعلامات البطيئة:
```sql
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

#### استخدام المساحة:
```sql
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;
```

## 🛡️ الأمان

### إعدادات الأمان

#### تشفير الاتصالات:
```bash
# في postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

#### تقييد الوصول:
```bash
# في pg_hba.conf
host    sabq_ai_cms    sabq_admin    127.0.0.1/32    md5
host    sabq_ai_cms    sabq_admin    ::1/128         md5
hostssl all            all           0.0.0.0/0       md5
```

#### مراجعة الصلاحيات:
```sql
-- فحص صلاحيات المستخدم
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='articles';

-- إزالة صلاحيات غير ضرورية
REVOKE ALL ON articles FROM public;
```

## 🔄 المايجريشن والتحديثات

### إنشاء مايجريشن جديد:
```bash
# إنشاء مايجريشن
npx prisma migrate dev --name add_new_feature

# تطبيق المايجريشن في الإنتاج
npx prisma migrate deploy

# إعادة تعيين قاعدة البيانات (للتطوير فقط)
npx prisma migrate reset
```

### التحقق من حالة المايجريشن:
```bash
# فحص حالة المايجريشن
npx prisma migrate status

# حل مشاكل المايجريشن
npx prisma migrate resolve --applied "20240101000000_init"
```

## 🚨 استكشاف الأخطاء وإصلاحها

### مشاكل شائعة وحلولها

#### خطأ الاتصال:
```bash
# تحقق من تشغيل PostgreSQL
sudo systemctl status postgresql

# تحقق من الپورت
sudo netstat -tuln | grep 5432

# تحقق من إعدادات الشبكة
ping localhost
```

#### مشاكل الصلاحيات:
```sql
-- إعطاء صلاحيات كاملة
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sabq_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sabq_admin;
```

#### مشاكل الذاكرة:
```bash
# في postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

## 📚 مراجع إضافية

### الوثائق الرسمية
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Supabase Documentation](https://supabase.com/docs)

### أدوات مفيدة
- [pgAdmin](https://www.pgadmin.org/) - إدارة قاعدة البيانات
- [DBeaver](https://dbeaver.io/) - عميل قاعدة البيانات
- [Prisma Studio](https://www.prisma.io/studio) - واجهة إدارة البيانات

### أوامر مفيدة
```bash
# إعادة تشغيل PostgreSQL
sudo systemctl restart postgresql

# فحص لوجات PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# اختبار الاتصال
psql -U sabq_admin -h localhost -d sabq_ai_cms -c "SELECT NOW();"

# إنشاء نسخة احتياطية مجدولة
echo "0 2 * * * pg_dump sabq_ai_cms > /backup/daily.sql" | crontab -
```

---

> **ملاحظة**: تأكد من تحديث كلمات المرور والإعدادات الأمنية قبل النشر في الإنتاج. 