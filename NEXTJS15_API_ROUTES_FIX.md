# إصلاح مشكلة API Routes في Next.js 15

## المشكلة
عند محاولة البناء على Vercel، ظهر الخطأ التالي:
```
Type error: Route "app/api/admin/users/[userId]/reset-password/route.ts" has an invalid "POST" export:
Type "{ params: { userId: string; }; }" is not a valid type for the function's second argument.
```

## السبب
في Next.js 15 مع App Router، تغيرت طريقة تعريف API Route handlers. المعامل `params` أصبح من نوع `Promise`.

## الصيغة القديمة (لا تعمل في Next.js 15) ❌
```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  // ...
}
```

## الصيغة الجديدة (Next.js 15) ✅
```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  // ...
}
```

## ملاحظات مهمة
1. **جميع معاملات params يجب أن تكون Promise** في Next.js 15
2. **يجب استخدام await** للحصول على القيم من params
3. **المعامل الأول يجب أن يكون request** (وليس req)

## التحقق من الملفات
للتحقق من أن جميع API routes تستخدم الصيغة الصحيحة:
```bash
# البحث عن الصيغة القديمة
grep -r "{ params }: { params: {" --include="*.ts" app/api/

# البحث عن الصيغة الجديدة
grep -r "params: Promise" --include="*.ts" app/api/
```

## حل مشكلة Vercel
إذا كان Vercel يحاول بناء commit قديم:
1. تحقق من Production Branch في إعدادات Vercel
2. قم بإنشاء commit جديد لإجبار إعادة البناء:
   ```bash
   git commit --allow-empty -m "Force rebuild"
   git push origin main
   ```

---
تم الإصلاح في: 2025-01-07 