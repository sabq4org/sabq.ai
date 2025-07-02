# تقرير حل مشاكل إنشاء المقال وجلب التصنيفات

## المشاكل المحددة

### 1. عدم جلب التصنيفات في صفحة إنشاء المقال
- **السبب**: عدم تطابق أنواع البيانات بين قاعدة البيانات (String) والواجهة (number)
- **الأعراض**: قائمة التصنيفات فارغة في نموذج إنشاء المقال

### 2. فشل إنشاء المقال
- **السبب**: عدم تطابق أسماء الحقول وأنواعها بين الواجهة وAPI
- **رسالة الخطأ**: "فشل إنشاء المقال"

## الحلول المطبقة

### 1. تحديث أنواع البيانات في الواجهة

#### في `app/dashboard/news/create/page.tsx`:

```typescript
// قبل
interface Category {
  id: number;
  // ...
}

interface ArticleFormData {
  category_id: number;
  subcategory_id?: number;
  // ...
}

// بعد
interface Category {
  id: string; // تغيير من number إلى string
  // ...
}

interface ArticleFormData {
  category_id: string; // تغيير من number إلى string
  subcategory_id?: string; // تغيير من number إلى string
  // ...
}
```

### 2. تحديث القيم الافتراضية

```typescript
// قبل
category_id: 0,

// بعد
category_id: '',
```

### 3. تحديث معالجات النماذج

```typescript
// قبل
onChange={(e) => setFormData(prev => ({ ...prev, category_id: Number(e.target.value) }))}

// بعد
onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
```

### 4. تحديث شروط التحقق

```typescript
// قبل
if (formData.category_id > 0) score += 10;

// بعد
if (formData.category_id && formData.category_id.length > 0) score += 10;
```

### 5. تحديث API المقالات

#### في `app/api/articles/route.ts`:

```typescript
// إضافة دعم لـ content_html
if (!body.title || (!body.content && !body.content_html)) {
  return NextResponse.json({
    success: false,
    error: 'العنوان والمحتوى مطلوبان'
  }, { status: 400 })
}

// تحويل category_id إلى String
if (body.category_id) {
  articleData.categoryId = String(body.category_id)
}
```

## التحقق من قاعدة البيانات

تم التحقق من وجود التصنيفات في قاعدة البيانات:
- اقتصاد (ID: 09337ce2-88e3-40fe-bc48-9702e73f6b05)
- تقنية (ID: 0f7b5d72-7895-42a5-8052-91b2144dff33)
- أخبار محلية (ID: b15eeb48-e874-41ce-b7a5-08801fd108d9)
- رياضة (ID: dda9657e-2754-4b8d-99c0-d55a7673e014)

## النتيجة

بعد تطبيق هذه التغييرات:
1. ✅ التصنيفات تظهر بشكل صحيح في قائمة الاختيار
2. ✅ يمكن اختيار التصنيف من القائمة
3. ✅ يمكن حفظ المقال بنجاح مع التصنيف المختار
4. ✅ البيانات تُحفظ بشكل صحيح في قاعدة البيانات

## توصيات إضافية

1. **إضافة المزيد من التصنيفات**: يمكن استخدام السكريبت `scripts/check-categories.js` لإضافة المزيد من التصنيفات
2. **تحسين رسائل الخطأ**: إضافة رسائل خطأ أكثر تفصيلاً في API
3. **إضافة تحقق من صحة البيانات**: التأكد من وجود التصنيف المختار في قاعدة البيانات قبل حفظ المقال 