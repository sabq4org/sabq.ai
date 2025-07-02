# تقرير تحديث خلية المراسل - صفحة المقال

## التاريخ: 2025-01-29

## الطلب
إزالة الإطار والخلفية من خلية اسم المراسل والتاريخ والوقت في شريط المعلومات المساعدة.

## التغييرات المطبقة

### 1. تعديل ملف page.tsx
تم إزالة الخلفية والإطار من خلية المراسل:

**قبل:**
```tsx
<div className="bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg">
  <div className="font-bold text-gray-900 dark:text-white">
    {article.author_name || 'سبق'}
  </div>
  <div className="text-sm text-gray-600 dark:text-gray-300">
    {formatFullDate(article.published_at || article.created_at || '')}
  </div>
</div>
```

**بعد:**
```tsx
<div>
  <div className="font-bold text-gray-900 dark:text-white">
    {article.author_name || 'سبق'}
  </div>
  <div className="text-sm text-gray-600 dark:text-gray-300">
    {formatFullDate(article.published_at || article.created_at || '')}
  </div>
</div>
```

### 2. تحديث ملف CSS
تم تعليق أو إزالة جميع الإصلاحات المتعلقة بخلفية خلية المراسل:
- إزالة `.dark .sticky .bg-gray-50`
- إزالة إصلاحات النصوص المتعلقة بـ `.bg-gray-50`
- إزالة إصلاح خلية المراسل والتاريخ

## النتيجة
- خلية المراسل أصبحت بدون خلفية أو إطار
- النصوص تظهر مباشرة بجانب الأيقونة
- التصميم أصبح أكثر بساطة ونظافة
- يعمل بشكل صحيح في الوضعين الفاتح والليلي

## الملفات المعدلة
1. `app/article/[id]/page.tsx` - إزالة كلاسات الخلفية والإطار
2. `app/article/[id]/article-dark-mode-fixes.css` - تعليق الإصلاحات غير المطلوبة 