# تقرير إصلاح مشكلة مسارات الصور

## التاريخ: 2025-01-01

## الملخص
تم إصلاح مشكلة عدم ظهور بعض الصور بشكل صحيح في الصفحة الرئيسية بسبب اختلاف أنواع مسارات الصور.

## المشكلة
كانت الصور تظهر بشكل مختلف أو تستبدل بصور بديلة من Unsplash للأسباب التالية:

1. **اختلاف أنواع المسارات**:
   - بعض الصور محفوظة على Cloudinary بـ URL كامل
   - بعض الصور محفوظة محلياً بمسار نسبي (`/uploads/...`)

2. **عدم معالجة المسارات النسبية**:
   - النظام لم يكن يتعامل بشكل صحيح مع المسارات النسبية
   - عند فشل تحميل الصورة، يتم استخدام صورة بديلة عشوائية

## المقالات المتأثرة
```
1. معرف: 44965e06-e7ec-48a2-9b07-db8ec27a088e
   - الصورة: https://res.cloudinary.com/... (تعمل بشكل صحيح)

2. معرف: dee1d3b6-9eb7-4e28-ab65-6a1c4d8e8dd9  
   - الصورة: /uploads/... (مسار نسبي - كانت المشكلة هنا)
```

## الحل المطبق

### 1. إضافة دالة معالجة مسارات الصور
```typescript
const processImageUrl = (imageUrl: string | null | undefined, fallbackTitle: string): string => {
  if (!imageUrl) {
    return generatePlaceholderImage(fallbackTitle);
  }
  
  // معالجة URLs الكاملة
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // معالجة المسارات النسبية
  if (imageUrl.startsWith('/')) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${baseUrl}${imageUrl}`;
  }
  
  return generatePlaceholderImage(fallbackTitle);
};
```

### 2. تحديث مكون NewsCard
- استخدام `processImageUrl` لمعالجة جميع أنواع المسارات
- إضافة `onError` handler للتعامل مع فشل تحميل الصور
- دعم كل من `featuredImage` و `featured_image` (للتوافق مع مختلف المصادر)

### 3. منع تغيير الصور العشوائي
- الصور البديلة تُختار بناءً على hash العنوان (ثابت لكل مقال)
- معالج الأخطاء يمنع الحلقات اللانهائية

## النتيجة
- جميع الصور تظهر بشكل صحيح بغض النظر عن نوع المسار
- الصور المحلية تُحمّل من الخادم بشكل صحيح
- الصور البديلة ثابتة لكل مقال (لا تتغير عشوائياً)
- معالجة أفضل لحالات الفشل

## التوصيات
1. **توحيد نظام رفع الصور**: يُفضل استخدام Cloudinary لجميع الصور
2. **إضافة تحقق من صحة URLs**: قبل حفظ الصورة في قاعدة البيانات
3. **مراقبة سجلات الأخطاء**: لرصد أي صور مفقودة أو تالفة

## الملفات المعدلة
- `app/page.tsx`: إضافة دالة `processImageUrl` وتحديث `NewsCard`
- `scripts/check-articles-images.js`: أداة فحص حالة الصور (جديد) 