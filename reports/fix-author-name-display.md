# تقرير إصلاح عرض اسم المؤلف في المقالات

## التاريخ: ${new Date().toLocaleDateString('ar-SA')}

## المشكلة
- كان اسم المؤلف/المراسل يظهر كـ "كاتب غير معروف" رغم اختياره من القائمة
- في صفحة تفاصيل المقال، لم يكن اسم المراسل يظهر

## السبب الجذري
1. في API إنشاء المقالات (`/api/articles/route.ts`):
   - كان يتم تعيين `authorId` بقيمة ثابتة `'default-author-id'`
   - لم يكن يتم استخدام `author_id` المرسل من الواجهة

2. عند جلب المقالات:
   - لم يكن هناك آلية لاستخراج اسم المؤلف وإضافته للاستجابة

## الحل المطبق

### 1. تحديث API إنشاء المقال
```typescript
// إضافة استقبال author_id و author_name
const {
  author_id,
  author_name,
  // ... باقي الحقول
} = body

// استخدام author_id المرسل وحفظ author_name في metadata
const article = await prisma.article.create({
  data: {
    authorId: author_id || 'default-author-id',
    metadata: {
      ...metadata,
      author_name: author_name || undefined
    }
  }
})
```

### 2. تحديث API جلب المقالات
```typescript
// استخراج اسم المؤلف من metadata أو author relation
let authorName = null;
if (article.metadata && typeof article.metadata === 'object' && 'author_name' in article.metadata) {
  authorName = (article.metadata as any).author_name;
} else if ((article as any).author) {
  authorName = (article as any).author.name;
}

// إضافته للاستجابة
return {
  author_name: authorName,
  // ... باقي البيانات
}
```

### 3. تحديث صفحات الواجهة
في صفحتي إنشاء وتعديل المقال:
```typescript
// الحصول على اسم المؤلف من القائمة
const selectedAuthor = authors.find(a => a.id === formData.authorId);

// إرساله مع البيانات
const articleData = {
  author_id: formData.authorId,
  author_name: selectedAuthor?.name,
  // ... باقي البيانات
}
```

### 4. تحديث API تحديث المقال (PUT)
```typescript
// معالجة author_name في metadata عند التحديث
if (key === 'author_name' && value) {
  updateData.metadata = {
    ...(existingArticle.metadata || {}),
    author_name: value
  };
}
```

## النتيجة
- ✅ اسم المؤلف يظهر بشكل صحيح في بطاقات المقالات
- ✅ اسم المؤلف يظهر في صفحة تفاصيل المقال
- ✅ يتم حفظ اسم المؤلف عند إنشاء أو تعديل المقال

## الملفات المحدثة
1. `app/api/articles/route.ts`
2. `app/api/articles/[id]/route.ts`
3. `app/dashboard/news/create/page.tsx`
4. `app/dashboard/news/edit/[id]/page.tsx`

## ملاحظات
- يتم حفظ اسم المؤلف في metadata لتجنب الحاجة لاستعلامات إضافية
- النظام يبحث عن اسم المؤلف في metadata أولاً، ثم في author relation كـ fallback
- هذا الحل يضمن عرض اسم المؤلف حتى لو لم يكن المؤلف موجوداً في جدول users 