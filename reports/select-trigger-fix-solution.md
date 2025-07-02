# حل مشكلة: SelectTrigger must be used within Select

## المشكلة
ظهور خطأ `Error: SelectTrigger must be used within Select` في صفحة إنشاء المقال.

## السبب
- المشروع يحتوي على نوعين من مكونات Select:
  1. `Select` العادي (HTML select element)
  2. `RadixSelect` الذي يعمل مع `SelectTrigger`, `SelectContent`, إلخ
- تم استخدام `SelectTrigger` مع `Select` العادي بدلاً من `RadixSelect`

## الحل المطبق
استبدال مكونات Select المعقدة بعناصر HTML select عادية:

### قبل:
```tsx
<Select value={formData.authorId} onValueChange={(value) => setFormData(...)}>
  <SelectTrigger>
    <SelectValue placeholder="اختر المراسل" />
  </SelectTrigger>
  <SelectContent>
    {authors.map(author => (
      <SelectItem key={author.id} value={author.id}>
        {author.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### بعد:
```tsx
<select
  value={formData.authorId}
  onChange={(e) => setFormData(prev => ({ ...prev, authorId: e.target.value }))}
  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
>
  <option value="">اختر المراسل</option>
  {authors.map(author => (
    <option key={author.id} value={author.id}>
      {author.name}
    </option>
  ))}
</select>
```

## النتيجة
- ✅ تم حل الخطأ
- ✅ القوائم المنسدلة تعمل بشكل صحيح
- ✅ التصميم متناسق مع باقي المكونات
- ✅ لا حاجة لمكتبات إضافية

## ملاحظات للمستقبل
- عند استخدام مكونات Radix UI، يجب استخدام `RadixSelect` مع `SelectTrigger`
- للقوائم البسيطة، يمكن استخدام HTML select العادي مع التنسيق المناسب
- التحقق من imports والتأكد من استخدام المكونات الصحيحة معاً 