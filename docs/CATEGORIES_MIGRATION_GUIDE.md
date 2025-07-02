# دليل ترحيل التصنيفات من البيئة المحلية إلى الإنتاج

## المشكلة
عند رفع المشروع للإنتاج، التصنيفات التي تم إعدادها في البيئة المحلية غير موجودة في قاعدة بيانات الإنتاج.

## الحلول المتاحة

### الحل 1: استخدام سكريبت التصدير والاستيراد (الموصى به)

#### 1. تصدير التصنيفات من البيئة المحلية

```bash
# تشغيل سكريبت التصدير
node scripts/export-categories.js
```

سيتم إنشاء ملفين:
- `data/categories-export.json` - ملف JSON يحتوي على جميع التصنيفات
- `data/categories-import.sql` - ملف SQL جاهز للاستيراد

#### 2. استيراد التصنيفات في الإنتاج

**الطريقة الأولى: استخدام ملف SQL**
```bash
# الاتصال بقاعدة بيانات الإنتاج
mysql -h YOUR_HOST -u YOUR_USER -p YOUR_DATABASE < data/categories-import.sql
```

**الطريقة الثانية: استخدام phpMyAdmin**
1. افتح phpMyAdmin في بيئة الإنتاج
2. اختر قاعدة البيانات
3. اذهب إلى تبويب "Import"
4. ارفع ملف `data/categories-import.sql`
5. اضغط "Go"

### الحل 2: استخدام Prisma Seed

#### 1. إنشاء ملف seed
```javascript
// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  { id: 1, name: 'رياضة', slug: 'sports', color: '#10b981', icon: '⚽', display_order: 1 },
  { id: 2, name: 'تقنية', slug: 'technology', color: '#8b5cf6', icon: '💻', display_order: 2 },
  { id: 3, name: 'اقتصاد', slug: 'economy', color: '#f59e0b', icon: '💰', display_order: 3 },
  { id: 4, name: 'سياسة', slug: 'politics', color: '#ef4444', icon: '🏛️', display_order: 4 },
  { id: 5, name: 'محليات', slug: 'local', color: '#3b82f6', icon: '🗺️', display_order: 5 },
  { id: 6, name: 'ثقافة', slug: 'culture', color: '#ec4899', icon: '🎭', display_order: 6 },
  { id: 7, name: 'صحة', slug: 'health', color: '#14b8a6', icon: '🏥', display_order: 7 },
  { id: 8, name: 'منوعات', slug: 'misc', color: '#6b7280', icon: '🎉', display_order: 8 }
];

async function main() {
  console.log('🌱 بدء إدراج التصنيفات...');
  
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category
    });
    console.log(`✅ تم إضافة/تحديث: ${category.name}`);
  }
  
  console.log('✨ تم الانتهاء من إدراج التصنيفات');
}

main()
  .catch(e => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### 2. إضافة script في package.json
```json
{
  "scripts": {
    "seed": "node prisma/seed.js"
  }
}
```

#### 3. تشغيل seed في الإنتاج
```bash
# في بيئة الإنتاج
npm run seed
```

### الحل 3: استخدام Migration مع البيانات الأولية

#### 1. إنشاء migration جديد
```bash
npx prisma migrate dev --name add_initial_categories
```

#### 2. تعديل ملف Migration
```sql
-- إضافة التصنيفات الأساسية
INSERT INTO categories (id, name, slug, color, icon, display_order, is_active) VALUES
(1, 'رياضة', 'sports', '#10b981', '⚽', 1, true),
(2, 'تقنية', 'technology', '#8b5cf6', '💻', 2, true),
(3, 'اقتصاد', 'economy', '#f59e0b', '💰', 3, true),
(4, 'سياسة', 'politics', '#ef4444', '🏛️', 4, true),
(5, 'محليات', 'local', '#3b82f6', '🗺️', 5, true),
(6, 'ثقافة', 'culture', '#ec4899', '🎭', 6, true),
(7, 'صحة', 'health', '#14b8a6', '🏥', 7, true),
(8, 'منوعات', 'misc', '#6b7280', '🎉', 8, true);
```

#### 3. تطبيق Migration في الإنتاج
```bash
npx prisma migrate deploy
```

### الحل 4: استخدام API لإدارة التصنيفات

#### 1. إنشاء API endpoint للاستيراد
```typescript
// app/api/admin/import-categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { categories } = await request.json();
    
    const results = [];
    for (const category of categories) {
      const result = await prisma.category.upsert({
        where: { id: category.id },
        update: category,
        create: category
      });
      results.push(result);
    }
    
    return NextResponse.json({
      success: true,
      imported: results.length,
      categories: results
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

#### 2. استخدام API من لوحة التحكم
- إنشاء صفحة في لوحة التحكم لاستيراد التصنيفات
- رفع ملف JSON واستدعاء API

## نصائح مهمة

### 1. النسخ الاحتياطي
```bash
# نسخ احتياطي قبل أي تغيير
mysqldump -h HOST -u USER -p DATABASE categories > categories_backup.sql
```

### 2. التحقق من التوافق
- تأكد من أسماء الأعمدة متطابقة بين البيئتين
- تحقق من أنواع البيانات (خاصة id إذا كان INT أو VARCHAR)

### 3. معالجة التضاربات
```sql
-- إذا كانت هناك تصنيفات موجودة بنفس ID
INSERT INTO categories (...) VALUES (...)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  slug = VALUES(slug),
  updated_at = NOW();
```

### 4. التحقق بعد الاستيراد
```sql
-- التحقق من عدد التصنيفات
SELECT COUNT(*) FROM categories;

-- عرض جميع التصنيفات
SELECT id, name, slug, display_order FROM categories ORDER BY display_order;
```

## أتمتة العملية

### سكريبت شامل للترحيل
```bash
#!/bin/bash
# scripts/migrate-categories.sh

echo "🚀 بدء ترحيل التصنيفات..."

# 1. تصدير من المحلي
echo "📤 تصدير التصنيفات من البيئة المحلية..."
node scripts/export-categories.js

# 2. رفع إلى السيرفر
echo "📡 رفع الملفات إلى السيرفر..."
scp data/categories-import.sql user@server:/path/to/project/

# 3. استيراد في الإنتاج
echo "📥 استيراد التصنيفات في الإنتاج..."
ssh user@server "cd /path/to/project && mysql -u DB_USER -p DB_NAME < categories-import.sql"

echo "✅ تم الانتهاء من ترحيل التصنيفات!"
```

## استكشاف الأخطاء

### مشكلة: "Duplicate entry for key 'PRIMARY'"
**الحل**: استخدم `ON DUPLICATE KEY UPDATE` أو احذف التصنيفات الموجودة أولاً

### مشكلة: "Unknown column"
**الحل**: تحقق من schema وتأكد من تطابق أسماء الأعمدة

### مشكلة: "Access denied"
**الحل**: تحقق من صلاحيات المستخدم في قاعدة البيانات

### مشكلة: "Character set issues"
**الحل**: تأكد من استخدام UTF-8
```sql
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
```

## الخلاصة
1. استخدم سكريبت التصدير/الاستيراد للحالات البسيطة
2. استخدم Prisma Seed للمشاريع التي تستخدم Prisma
3. استخدم Migrations للتكامل مع نظام إدارة قاعدة البيانات
4. قم بأخذ نسخ احتياطية دائماً قبل أي تغيير 