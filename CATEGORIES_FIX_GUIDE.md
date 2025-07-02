# دليل حل مشكلة إضافة التصنيفات

## المشكلة
عند محاولة إضافة تصنيف جديد من لوحة التحكم، تظهر رسالة: "الاسم والمعرف (slug) مطلوبان"

## السبب
كان هناك عدم توافق بين أسماء الحقول المرسلة من النموذج (name_ar) والمتوقعة في API (name).

## الحل المطبق
1. تم تحديث `/api/categories/route.ts` لقبول كل من `name` و `name_ar`
2. تم إنشاء `/api/categories/[id]/route.ts` لمعالجة طلبات التحديث والحذف

## طرق إضافة التصنيفات

### الطريقة 1: من لوحة التحكم (بعد نشر التحديثات)
1. اذهب إلى: https://sabq-ai-cms-production.up.railway.app/dashboard/categories
2. اضغط على "إضافة تصنيف جديد"
3. املأ البيانات المطلوبة
4. اضغط "إضافة التصنيف"

### الطريقة 2: باستخدام curl (مباشرة)
```bash
# إضافة تصنيف الأخبار
curl -X POST "https://sabq-ai-cms-production.up.railway.app/api/categories" \
  -H "Content-Type: application/json" \
  -d '{
    "name_ar": "أخبار",
    "slug": "news",
    "description": "آخر الأخبار المحلية والعالمية",
    "color_hex": "#E5F1FA",
    "icon": "📰"
  }'

# إضافة تصنيف الرياضة
curl -X POST "https://sabq-ai-cms-production.up.railway.app/api/categories" \
  -H "Content-Type: application/json" \
  -d '{
    "name_ar": "رياضة",
    "slug": "sports",
    "description": "أخبار الرياضة والمباريات",
    "color_hex": "#E3FCEF",
    "icon": "⚽"
  }'

# إضافة تصنيف التقنية
curl -X POST "https://sabq-ai-cms-production.up.railway.app/api/categories" \
  -H "Content-Type: application/json" \
  -d '{
    "name_ar": "تقنية",
    "slug": "technology",
    "description": "آخر أخبار التقنية والابتكار",
    "color_hex": "#FFF5E5",
    "icon": "💻"
  }'
```

### الطريقة 3: باستخدام السكريبت الجاهز
```bash
# تشغيل سكريبت bash
bash scripts/add-categories-curl.sh

# أو تشغيل سكريبت Node.js
node scripts/add-categories-production.js
```

### الطريقة 4: باستخدام سكريبت الاستيراد المباشر
```bash
node scripts/import-categories-direct.js
```

## التحقق من التصنيفات
- عبر API: https://sabq-ai-cms-production.up.railway.app/api/categories
- من لوحة التحكم: https://sabq-ai-cms-production.up.railway.app/dashboard/categories

## نشر التحديثات
إذا لم تعمل الطريقة الأولى، يجب نشر التحديثات أولاً:
```bash
git add .
git commit -m "Fix categories API to accept name_ar field"
git push origin main
```

ثم انتظر حتى يكتمل النشر التلقائي على Railway. 