# تقرير حل مشكلة الاتصال بقاعدة بيانات PlanetScale

## التاريخ: 2025-07-06

## المشكلة
- رسالة خطأ: "لا توجد تصنيفات متاحة حالياً" و "لا توجد أخبار"
- أخطاء في الاتصال بقاعدة البيانات
- أخطاء في أسماء النماذج والحقول

## الأسباب
1. **خطأ في أسماء النماذج**: استخدام `prisma.article` و `prisma.category` بينما النماذج الصحيحة هي `prisma.articles` و `prisma.categories` (بصيغة الجمع)
2. **خطأ في أسماء الحقول**: استخدام camelCase مثل `createdAt` بدلاً من snake_case مثل `created_at`
3. **عدم وجود علاقات في Schema**: محاولة استخدام `include` للعلاقات غير الموجودة
4. **مشكلة في DATABASE_URL**: كان يحتوي على رابط PostgreSQL قديم

## الحلول المطبقة

### 1. إصلاح ملف app/api/articles/route.ts
```typescript
// قبل
articles = await prisma.article.findMany({
  include: {
    category: true,
    author: true
  }
})

// بعد
articles = await prisma.articles.findMany({
  where,
  orderBy,
  skip,
  take: limit
})

// جلب التصنيفات منفصلة
const categories = await prisma.categories.findMany({
  where: { id: { in: categoryIds } }
})
```

### 2. إصلاح ملف app/api/categories/route.ts
```typescript
// قبل
await prisma.category.findMany()
await prisma.article.groupBy()

// بعد
await prisma.categories.findMany()
await prisma.articles.groupBy()
```

### 3. تصحيح أسماء الحقول
```typescript
// قبل
orderBy: { createdAt: 'desc' }
where: { categoryId: id }

// بعد
orderBy: { created_at: 'desc' }
where: { category_id: id }
```

### 4. تحديث DATABASE_URL في .env.local
```bash
DATABASE_URL='mysql://[USERNAME]:[PASSWORD]@aws.connect.psdb.cloud/[DATABASE]?sslaccept=strict'
```

## النتائج
- ✅ API المقالات يعمل بنجاح ويرجع 11 مقال
- ✅ API التصنيفات يعمل بنجاح ويرجع 8 تصنيفات
- ✅ البيانات تُجلب من PlanetScale بنجاح
- ✅ جميع الصور تُحمل من Cloudinary

## ملاحظات مهمة
1. **أسماء النماذج في PlanetScale**: جميعها بصيغة الجمع (articles, categories, users, etc.)
2. **أسماء الحقول**: جميعها بصيغة snake_case (created_at, category_id, etc.)
3. **العلاقات**: غير محددة في Prisma Schema، يجب جلب البيانات المرتبطة منفصلة
4. **PlanetScale**: يستخدم MySQL وليس PostgreSQL

## التوصيات
1. تحديث جميع ملفات API لاستخدام أسماء النماذج والحقول الصحيحة
2. إضافة العلاقات في Prisma Schema إذا لزم الأمر
3. التأكد من تطابق DATABASE_URL في جميع البيئات
4. إنشاء ملف مرجعي لأسماء النماذج والحقول 