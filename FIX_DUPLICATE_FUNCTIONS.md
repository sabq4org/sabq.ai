# إصلاح مشكلة التعريفات المكررة

## المشكلة
كان هناك خطأ في البناء يشير إلى أن الدالة `loadArticles` معرفة أكثر من مرة:
```
the name `loadArticles` is defined multiple times
```

## السبب
كانت الدوال التالية معرفة في ملفين مختلفين:
- `/app/api/articles/route.ts`
- `/app/api/articles/[id]/route.ts`

مما تسبب في تضارب في التعريفات.

## الحل

### 1. إنشاء ملف مشترك للوظائف
أنشأنا ملف `/lib/articles-storage.ts` يحتوي على:
- نوع `Article` interface
- دالة `loadArticles()` لقراءة المقالات
- دالة `saveArticles()` لحفظ المقالات
- دالة `addArticle()` لإضافة مقال جديد
- دالة `updateArticle()` لتحديث مقال
- دالة `softDeleteArticles()` لحذف المقالات بشكل ناعم

### 2. تحديث ملف API Route
حدثنا `/app/api/articles/[id]/route.ts` ليستورد الوظائف من الملف المشترك بدلاً من تعريفها محلياً.

### 3. إصلاح مشكلة Next.js 15
في Next.js 15، يجب استخدام `await` مع `params`:
```typescript
// قبل
{ params }: { params: { id: string } }
const article = articles.find(a => a.id === params.id);

// بعد
{ params }: { params: Promise<{ id: string }> }
const { id } = await params;
const article = articles.find(a => a.id === id);
```

## النتيجة
- تم حل مشكلة التعريفات المكررة
- تحسين تنظيم الكود بوضع الوظائف المشتركة في ملف منفصل
- التوافق مع Next.js 15

## الملفات المعدلة
1. `/lib/articles-storage.ts` - ملف جديد
2. `/app/api/articles/[id]/route.ts` - محدث 