# خطة ترحيل منصة "سبق الذكية" إلى قاعدة البيانات المركزية

## المرحلة 1: التحضير والإعداد

### 1.1 تحديث إعدادات Prisma لتحسين الأداء
- تحسين Connection Pool
- إضافة إعدادات للأداء العالي
- إعداد استراتيجيات التخزين المؤقت

### 1.2 إنشاء جداول قاعدة البيانات المفقودة
الجداول الموجودة حالياً في ملفات JSON وتحتاج إلى ترحيل:
- `team_members` - أعضاء الفريق
- `email_verification_codes` - رموز التحقق من البريد
- `password_reset_tokens` - رموز إعادة تعيين كلمة المرور
- `templates` - قوالب المحتوى
- `template_previews` - معاينات القوالب
- `home_blocks_config` - إعدادات كتل الصفحة الرئيسية

## المرحلة 2: ترحيل البيانات

### 2.1 ترحيل البيانات الأساسية (بالترتيب)
1. **المستخدمون** (`users.json` → `users` table)
2. **الأدوار** (`roles.json` → `roles` table)
3. **أعضاء الفريق** (`team_members.json` → جدول جديد `team_members`)
4. **التصنيفات** (`categories.json` → `categories` table)
5. **المقالات** (`articles.json` + `articles_backup_20250623_161538.json` → `articles` table)

### 2.2 ترحيل بيانات التفاعل
1. **تفضيلات المستخدمين** (`user_preferences.json` → `user_preferences` table)
2. **تفاعلات المستخدمين** (`user_article_interactions.json` → `interactions` table)
3. **نقاط الولاء** (`user_loyalty_points.json` → `loyalty_points` table)
4. **سجلات الأنشطة** (`admin_activity_logs.json` → `activity_logs` table)

### 2.3 ترحيل البيانات المتقدمة
1. **التحليلات العميقة** (`deep_analyses.json` → `deep_analyses` table)
2. **الكتل الذكية** (`smart_blocks.json` → `smart_blocks` table)
3. **الكلمات المفتاحية** (`keywords.json` → `keywords` table)
4. **الرسائل** (`messages.json` → `messages` table)

## المرحلة 3: تحديث الكود

### 3.1 استبدال قراءة ملفات JSON بـ Prisma ORM
الملفات التي تحتاج تحديث:
- `/lib/articles-storage.ts` - استبدال بـ Prisma queries
- `/lib/services/templateService.ts` - استبدال قراءة templates.json
- `/app/api/dashboard/insights/behavior/route.ts` - استبدال قراءة ملفات متعددة
- جميع ملفات API التي تستخدم fs.readFile

### 3.2 تحديث نقاط النهاية (API Endpoints)
- تحديث جميع نقاط النهاية لاستخدام Prisma
- إزالة أي اعتماد على نظام الملفات
- التأكد من استخدام المعاملات (transactions) عند الحاجة

## المرحلة 4: تحسين الأداء

### 4.1 إعداد Connection Pool المحسّن
```typescript
// في lib/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
  // إعدادات Connection Pool
  connection_limit: 25,
  connect_timeout: 10,
  pool_timeout: 10,
  socket_timeout: 10,
});
```

### 4.2 إضافة طبقة التخزين المؤقت (Cache Layer)
- استخدام Redis أو Upstash للتخزين المؤقت
- تخزين مؤقت للقراءات المتكررة:
  - قوائم المقالات
  - التصنيفات
  - بيانات المستخدمين
  - التحليلات

### 4.3 تحسين الاستعلامات
- استخدام `select` لجلب الحقول المطلوبة فقط
- استخدام `include` بحذر
- إضافة فهارس للحقول المستخدمة في البحث

## المرحلة 5: الاختبار والتحقق

### 5.1 اختبار الترحيل
- التحقق من سلامة البيانات المرحّلة
- مقارنة عدد السجلات
- التحقق من العلاقات بين الجداول

### 5.2 اختبار الأداء
- قياس أوقات الاستجابة
- اختبار الحمل (Load Testing)
- مراقبة استخدام الذاكرة

## المرحلة 6: النشر والمراقبة

### 6.1 خطة النشر
1. نسخ احتياطي كامل للبيانات
2. تشغيل scripts الترحيل
3. تحديث متغيرات البيئة
4. نشر الكود المحدث
5. التحقق من عمل جميع الخدمات

### 6.2 المراقبة المستمرة
- مراقبة أداء قاعدة البيانات
- تتبع الأخطاء
- مراقبة استخدام الموارد

## الجدول الزمني المقترح
- المرحلة 1: يوم واحد
- المرحلة 2: 2-3 أيام
- المرحلة 3: 3-4 أيام
- المرحلة 4: 2 أيام
- المرحلة 5: يوم واحد
- المرحلة 6: يوم واحد

**إجمالي الوقت المقدر: 10-12 يوم عمل** 