# تقرير إصلاح مشكلة عدم ظهور الاهتمامات المحفوظة عند التعديل

## المشكلة
عندما يضغط المستخدم على زر "تعديل" في قسم الاهتمامات في الملف الشخصي، يتم توجيهه لصفحة `/welcome/preferences` ولكن الاهتمامات المحفوظة مسبقاً لا تظهر محددة، وكأنه يختار من جديد.

## السبب
في صفحة `app/welcome/preferences/page.tsx`، كان يتم تحميل التصنيفات فقط دون تحميل الاهتمامات المحفوظة للمستخدم. القائمة `selectedCategoryIds` كانت تبدأ كمصفوفة فارغة دائماً.

## الحل
إضافة دالة `fetchUserInterests` لتحميل الاهتمامات المحفوظة من قاعدة البيانات عند تحميل الصفحة:

```typescript
// جلب الاهتمامات المحفوظة للمستخدم
const fetchUserInterests = async () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      const userId = user.id;
      
      if (userId) {
        // جلب الاهتمامات من قاعدة البيانات
        const response = await fetch(`/api/user/interests?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.interests && Array.isArray(data.interests)) {
            const categoryIds = data.interests
              .filter((interest: any) => interest.categoryId)
              .map((interest: any) => interest.categoryId);
            setSelectedCategoryIds(categoryIds);
            console.log('تم تحميل الاهتمامات المحفوظة:', categoryIds);
          }
        }
      }
    }
  } catch (error) {
    console.error('خطأ في تحميل الاهتمامات:', error);
  }
};
```

وتم استدعاؤها في `useEffect`:

```typescript
useEffect(() => {
  // تحميل التصنيفات والاهتمامات المحفوظة
  fetchCategories();
  fetchUserInterests();
}, []);
```

## التدفق
1. المستخدم يفتح الملف الشخصي ويرى اهتماماته المحفوظة
2. يضغط على زر "تعديل" بجانب الاهتمامات
3. يتم توجيهه إلى `/welcome/preferences`
4. الصفحة تحمل التصنيفات من API
5. **الجديد**: الصفحة تحمل أيضاً الاهتمامات المحفوظة للمستخدم من API
6. التصنيفات المحفوظة تظهر محددة عند الدخول لصفحة التعديل
7. المستخدم يمكنه إضافة أو إزالة اهتمامات
8. عند الحفظ، يتم تحديث الاهتمامات في قاعدة البيانات

## الملفات المعدلة
- `app/welcome/preferences/page.tsx` - إضافة تحميل الاهتمامات المحفوظة

## API المحدث
تم إنشاء API جديد `/api/user/saved-categories` الذي:
1. يجلب التصنيفات المحفوظة من `UserPreference` أولاً
2. إذا لم يجد، يبحث في `UserInterest` ويحولها لمعرفات تصنيفات
3. يعيد مصفوفة من معرفات التصنيفات مع مصدرها

## الكود المحدث في `app/welcome/preferences/page.tsx`:
```typescript
// جلب التصنيفات المحفوظة من قاعدة البيانات
const response = await fetch(`/api/user/saved-categories?userId=${userId}`);
if (response.ok) {
  const data = await response.json();
  
  if (data.success && data.categoryIds && data.categoryIds.length > 0) {
    setSelectedCategoryIds(data.categoryIds);
    console.log('تم تحميل الاهتمامات المحفوظة:', data.categoryIds, 'من:', data.source);
  } else {
    // إذا لم نجد في قاعدة البيانات، نحاول من localStorage
    if (user.interests && Array.isArray(user.interests)) {
      setSelectedCategoryIds(user.interests);
      console.log('تم تحميل الاهتمامات من localStorage:', user.interests);
    }
  }
}
```

## الملفات المعدلة
- `app/welcome/preferences/page.tsx` - إضافة تحميل الاهتمامات المحفوظة
- `app/api/user/saved-categories/route.ts` - API جديد لجلب التصنيفات المحفوظة

## الحالة الحالية
✅ المشكلة محلولة - الاهتمامات المحفوظة تظهر الآن محددة عند الدخول لصفحة التعديل
✅ يدعم المستخدمين المسجلين والضيوف
✅ يجلب من قاعدة البيانات أو localStorage حسب نوع المستخدم 