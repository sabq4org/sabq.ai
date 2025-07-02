# تقرير إصلاح مشكلة API التفضيلات

## المشكلة الأصلية
كان المستخدم يعاني من خطأ "حدث خطأ في حفظ التفضيلات" عند محاولة حفظ تفضيلات المستخدم.

## التحليل
بعد التحقيق في الكود، تم اكتشاف عدة مشاكل:

### 1. تضارب في تنسيق البيانات
- ملف `user_preferences.json` كان يستخدم تنسيق مصفوفة `[]`
- API كان يتوقع تنسيق كائن `{ preferences: [] }`

### 2. مشاكل في Prisma Schema
- الكود كان يحاول استخدام `prisma.userInterest` غير الموجود
- تم استبداله بـ `prisma.userPreference` الموجود في Schema

### 3. مشاكل في أنواع البيانات
- `categoryIds` كانت تُرسل كأرقام بسيطة `[1, 2, 3]`
- قاعدة البيانات تتوقع UUIDs مثل `"94604730-5d3b-43f2-ab8d-fab7b1114f6b"`

## الإصلاحات المطبقة

### 1. إصلاح API التفضيلات الرئيسي (`app/api/user/preferences/route.ts`)
```typescript
// إصلاح تنسيق البيانات
if (!Array.isArray(data)) {
  data = [];
}

// تحويل categoryIds إلى strings
const categoryIdsAsStrings = categoryIds.map(id => id.toString());

// استخدام UserPreference بدلاً من userInterest
const newPreferences = await prisma.userPreference.createMany({
  data: categories.map(category => ({
    userId,
    key: `category_${category.slug}`,
    value: {
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
      score: 1.0,
      source: source
    }
  }))
});
```

### 2. إصلاح API تحديث التفضيلات (`app/api/user/preferences/update/route.ts`)
```typescript
// إصلاح تنسيق البيانات
let data: any[] = [];
if (!Array.isArray(data)) {
  data = [];
}

// حذف التفضيلات القديمة وإضافة الجديدة
data = data.filter((pref: any) => pref.user_id !== userId);
```

### 3. إصلاح ملف التفضيلات
تم التأكد من أن ملف `data/user_preferences.json` يستخدم التنسيق الصحيح:
```json
[
  {
    "user_id": "test-user-123",
    "category_id": "94604730-5d3b-43f2-ab8d-fab7b1114f6b",
    "source": "manual",
    "created_at": "2025-07-02T07:34:18.167Z",
    "updated_at": "2025-07-02T07:34:18.167Z"
  }
]
```

## الاختبارات
تم إنشاء سكريبت اختبار `scripts/test-preferences-api.js` وتم اختبار:

1. ✅ جلب التفضيلات: `GET /api/user/preferences?userId=test-user-123`
2. ✅ حفظ تفضيلات جديدة: `POST /api/user/preferences`
3. ✅ التحقق من حفظ البيانات في الملف
4. ✅ التحقق من حفظ البيانات في قاعدة البيانات

## النتائج
- تم إصلاح جميع مشاكل API التفضيلات
- API يعمل بشكل صحيح مع UUIDs
- البيانات تُحفظ في كل من الملف وقاعدة البيانات
- تم إضافة تسجيل النشاط في `ActivityLog`

## التوصيات
1. التأكد من استخدام UUIDs صحيحة عند إرسال `categoryIds`
2. مراجعة واجهة المستخدم للتأكد من إرسال البيانات بالشكل الصحيح
3. إضافة validation إضافي للبيانات الواردة
4. إضافة اختبارات unit tests للـ API

## الملفات المعدلة
- `app/api/user/preferences/route.ts`
- `app/api/user/preferences/update/route.ts`
- `scripts/test-preferences-api.js` (جديد)
- `reports/preferences-api-fix-report.md` (هذا الملف)

## الحالة النهائية
✅ **تم حل المشكلة بنجاح** - API التفضيلات يعمل بشكل صحيح ويمكن للمستخدمين حفظ تفضيلاتهم بدون أخطاء. 