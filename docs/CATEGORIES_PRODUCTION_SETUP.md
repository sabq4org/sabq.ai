# دليل إعداد التصنيفات في بيئة الإنتاج

## المشكلة
عند رفع المشروع للإنتاج، التصنيفات المُعدة في البيئة المحلية غير موجودة في قاعدة بيانات الإنتاج.

## الحل السريع (3 خطوات)

### 1. تصدير التصنيفات من البيئة المحلية
```bash
# في مجلد المشروع المحلي
node scripts/export-categories.js
```

سيتم إنشاء ملفين:
- `data/categories-export.json` - نسخة احتياطية
- `data/categories-import.sql` - ملف SQL للاستيراد

### 2. رفع ملف SQL إلى السيرفر
```bash
# رفع الملف إلى السيرفر
scp data/categories-import.sql user@your-server:/path/to/upload/
```

### 3. استيراد التصنيفات في قاعدة البيانات

#### الطريقة الأولى: عبر phpMyAdmin (الأسهل)
1. افتح phpMyAdmin
2. اختر قاعدة البيانات
3. اضغط على "Import"
4. اختر ملف `categories-import.sql`
5. اضغط "Go"

#### الطريقة الثانية: عبر SSH
```bash
# الاتصال بالسيرفر
ssh user@your-server

# الانتقال لمجلد الملف
cd /path/to/upload/

# استيراد التصنيفات
mysql -u DB_USER -p DB_NAME < categories-import.sql
```

## حل بديل: استخدام ملف SQL الجاهز

إذا لم تتمكن من تصدير التصنيفات، استخدم هذا الملف الجاهز:

### 1. استخدم ملف `database/initial_categories.sql`
هذا الملف يحتوي على التصنيفات الأساسية:
- رياضة
- تقنية  
- اقتصاد
- سياسة
- محليات
- ثقافة
- صحة
- تعليم
- سياحة
- منوعات

### 2. استيراد الملف
```bash
# في phpMyAdmin أو عبر SSH
mysql -u DB_USER -p DB_NAME < database/initial_categories.sql
```

## ملاحظات مهمة

### 1. نوع معرف التصنيف (ID)
- إذا كان مشروعك يستخدم UUID: استخدم ملف التصدير
- إذا كان يستخدم أرقام عادية: استخدم `initial_categories.sql`

### 2. التحقق من النجاح
```sql
-- عد التصنيفات
SELECT COUNT(*) FROM categories;

-- عرض التصنيفات
SELECT id, name, slug FROM categories ORDER BY display_order;
```

### 3. تحديث Prisma (إذا لزم)
```bash
# في بيئة الإنتاج
npx prisma db pull
npx prisma generate
```

## حل المشاكل الشائعة

### خطأ "Unknown column"
تحقق من أسماء الأعمدة في جدول categories:
```sql
SHOW COLUMNS FROM categories;
```

### خطأ "Duplicate entry"
التصنيف موجود بالفعل، استخدم:
```sql
-- حذف التصنيفات الموجودة أولاً
DELETE FROM categories;

-- ثم استيراد الجديدة
SOURCE categories-import.sql;
```

### مشكلة الترميز
```sql
-- قبل الاستيراد
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
```

## نصيحة للمستقبل

أضف التصنيفات في ملف migration أو seed:

### في package.json
```json
{
  "scripts": {
    "seed:categories": "node scripts/seed-categories.js"
  }
}
```

### عند النشر
```bash
npm run seed:categories
```

## الدعم
إذا واجهت أي مشكلة:
1. تحقق من logs قاعدة البيانات
2. تأكد من صلاحيات المستخدم
3. راجع ملف `CATEGORIES_MIGRATION_GUIDE.md` للحلول المتقدمة 