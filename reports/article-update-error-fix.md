# تقرير حل خطأ تحديث المقال
📅 التاريخ: 2025-01-29

## ❌ المشكلة

عند محاولة تحديث مقال من صفحة التعديل، كان يظهر خطأ:
```
Error: فشل في تحديث المقال
PUT /api/articles/60c3625b-37cb-4b52-b4d5-3a362edaf4f7 500
```

## 🔍 السبب الجذري

عدم تطابق أسماء الحقول بين:
- **صفحة التعديل**: ترسل البيانات بـ snake_case (مثل `author_id`, `is_featured`)
- **Prisma Schema**: يتوقع camelCase (مثل `authorId`, `featured`)

## ✅ الحل المطبق

### 1. إضافة تحويل أسماء الحقول في API

```typescript
// خريطة تحويل الأسماء
const fieldMapping: Record<string, string> = {
  author_id: 'authorId',
  category_id: 'categoryId',
  featured_image: 'featuredImage',
  is_featured: 'featured',
  is_breaking: 'breaking',
  allow_comments: 'allowComments',
  reading_time: 'readingTime',
  scheduled_for: 'scheduledFor',
  seo_description: 'seoDescription',
  seo_keywords: 'seoKeywords',
  seo_title: 'seoTitle',
  social_image: 'socialImage',
  published_at: 'publishedAt',
  created_at: 'createdAt',
  updated_at: 'updatedAt'
};
```

### 2. معالجة خاصة لحقول معينة

#### الكلمات المفتاحية:
```typescript
if (key === 'keywords' && Array.isArray(value)) {
  updateData.seoKeywords = value.join(', ');
}
```

#### الحقول المنطقية:
```typescript
else if (['is_featured', 'is_breaking', 'allow_comments'].includes(key)) {
  updateData[fieldMapping[key]] = Boolean(value);
}
```

#### الموجز/الملخص:
```typescript
else if (key === 'summary') {
  updateData.excerpt = value;
}
```

#### التواريخ:
```typescript
else if (value && (key === 'scheduled_for' || key === 'published_at')) {
  updateData[fieldMapping[key]] = new Date(value as string);
}
```

### 3. تحسين معالجة الأخطاء

```typescript
return NextResponse.json({ 
  success: false, 
  error: 'فشل في تحديث المقال',
  details: e instanceof Error ? e.message : 'خطأ غير معروف'
}, { status: 500 });
```

## 📋 الحقول المدعومة

### حقول أساسية:
- `title` → `title`
- `content` → `content`
- `summary` → `excerpt`
- `status` → `status`

### حقول المؤلف والتصنيف:
- `author_id` → `authorId`
- `category_id` → `categoryId`

### حقول العرض:
- `is_featured` → `featured`
- `is_breaking` → `breaking`
- `featured_image` → `featuredImage`

### حقول SEO:
- `seo_title` → `seoTitle`
- `seo_description` → `seoDescription`
- `keywords` → `seoKeywords` (كـ string مفصول بفواصل)

### حقول أخرى:
- `allow_comments` → `allowComments`
- `reading_time` → `readingTime`
- `scheduled_for` → `scheduledFor`

## 🔧 كيفية التحقق

1. **تسجيل الدخول كمسؤول**:
   ```bash
   # اذهب إلى
   http://localhost:3000/login
   ```

2. **فتح صفحة تعديل المقال**:
   ```bash
   http://localhost:3000/dashboard/article/edit/[article-id]
   ```

3. **تعديل المقال وحفظه**:
   - عدّل أي حقل
   - اضغط على "حفظ التعديلات"
   - يجب أن يتم الحفظ بنجاح

## 💡 ملاحظات مهمة

1. **تسجيل الدخول مطلوب**: صفحة التعديل محمية وتتطلب تسجيل دخول
2. **الصلاحيات**: تحتاج صلاحيات مناسبة لتعديل المقالات
3. **Cache**: يتم حذف المقال من الكاش عند التحديث

## 🚀 التحسينات المستقبلية المقترحة

1. **توحيد أسماء الحقول**: استخدام camelCase في كل مكان
2. **تحسين رسائل الخطأ**: إضافة تفاصيل أكثر عن سبب الفشل
3. **تسجيل العمليات**: حفظ سجل بكل التعديلات
4. **النسخ الاحتياطي**: حفظ نسخة قبل التعديل

---

**الخلاصة**: تم حل مشكلة تحديث المقالات بإضافة تحويل صحيح لأسماء الحقول من snake_case إلى camelCase لتتوافق مع Prisma schema. 