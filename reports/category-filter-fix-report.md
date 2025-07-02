# تقرير إصلاح فلترة التصنيفات

## تاريخ التنفيذ
24 يناير 2025

## المشكلة
عند اختيار تصنيف في قسم "استكشف بحسب التصنيفات" في الصفحة الرئيسية، كانت تظهر مقالات من تصنيفات مختلفة بدلاً من المقالات المرتبطة بالتصنيف المختار فقط.

## السبب الجذري
1. **خطأ في اسم المعامل**: كانت دالة `fetchCategoryArticles` تستخدم `category` بدلاً من `category_id` في طلب API:
   ```javascript
   // خطأ
   const response = await fetch(`/api/articles?category=${categoryId}&status=published&limit=6`);
   
   // صحيح
   const response = await fetch(`/api/articles?category_id=${categoryId}&status=published&limit=6`);
   ```

2. **عدم تطابق الأنواع**: كانت هناك مشكلة في أنواع البيانات:
   - `category.id` في قاعدة البيانات من نوع `String`
   - `selectedCategory` state كان من نوع `number`
   - هذا أدى إلى عدم تطابق في المقارنات والفلترة

3. **خطأ مماثل في صفحة المقال**: كانت دالة `fetchRelatedArticles` في صفحة المقال تستخدم `category` مع اسم التصنيف بدلاً من `category_id`:
   ```javascript
   // خطأ
   const categoryName = article.category?.name_ar || article.category_id;
   const response = await fetch(`/api/articles?status=published&category=${encodeURIComponent(categoryName)}&limit=6`);
   
   // صحيح
   const categoryId = article.category?.id || article.category_id;
   const response = await fetch(`/api/articles?status=published&category_id=${categoryId}&limit=6`);
   ```

## الحل المطبق

### 1. تصحيح اسم المعامل في API (الصفحة الرئيسية)
```diff
- const response = await fetch(`/api/articles?category=${categoryId}&status=published&limit=6`);
+ const response = await fetch(`/api/articles?category_id=${categoryId}&status=published&limit=6`);
```

### 2. توحيد أنواع البيانات
تم تحديث جميع الأماكن لاستخدام `string` بدلاً من `number`:

```diff
- const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
+ const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

- const fetchCategoryArticles = async (categoryId: number) => {
+ const fetchCategoryArticles = async (categoryId: string) => {

- const handleCategoryClick = async (categoryId: number) => {
+ const handleCategoryClick = async (categoryId: string) => {

- const trackInteraction = async (articleId: string, interactionType: string, categoryId?: number) => {
+ const trackInteraction = async (articleId: string, interactionType: string, categoryId?: string) => {
```

### 3. تصحيح جلب المقالات ذات الصلة (صفحة المقال)
```diff
- const categoryName = article.category?.name_ar || article.category_id;
- const response = await fetch(`/api/articles?status=published&category=${encodeURIComponent(categoryName)}&limit=6`);
+ const categoryId = article.category?.id || article.category_id;
+ if (categoryId) {
+   const response = await fetch(`/api/articles?status=published&category_id=${categoryId}&limit=6`);
```

## الملفات المعدلة
1. `app/page.tsx` - الصفحة الرئيسية
2. `app/article/[id]/page.tsx` - صفحة المقال

## النتيجة
- ✅ الآن عند اختيار تصنيف معين، تظهر فقط المقالات المرتبطة بهذا التصنيف
- ✅ المقالات ذات الصلة في صفحة المقال تعرض فقط المقالات من نفس التصنيف
- ✅ لا توجد أخطاء في console
- ✅ الفلترة تعمل بشكل صحيح في جميع الصفحات

## ملاحظات تقنية
- API endpoint `/api/articles` يتوقع `category_id` كمعامل للفلترة
- جميع معرفات التصنيفات في قاعدة البيانات من نوع `String` (UUID)
- تم التحقق من أن API يعالج `category_id` بشكل صحيح في `app/api/articles/route.ts` 