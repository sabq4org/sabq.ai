# إصلاح Next.js 15 API Routes

## المشكلة
في Next.js 15، تغيرت صيغة API Route handlers. لا يمكن استخدام `Promise` في تعريف `params`.

## رسالة الخطأ
```
Type error: Route "app/api/articles/[id]/route.ts" has an invalid "GET" export:
Type "{ params: { id: string; }; }" is not a valid type for the function's second argument.
```

## الحل

### ❌ الصيغة القديمة (خاطئة)
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

### ✅ الصيغة الجديدة (صحيحة)
```typescript
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  // ...
}
```

## التغييرات المطلوبة

1. **إزالة `Promise` من تعريف `params`**
2. **إزالة `await` عند استخدام `params`**
3. **استخدام `context` كاسم المعامل الثاني**
4. **استخدام `NextRequest` بدلاً من `Request`**

## الملفات التي تم تحديثها

- ✅ `/app/api/articles/[id]/route.ts`
- ✅ `/app/api/admin/users/[userId]/route.ts`
- ✅ `/app/api/admin/comments/[id]/status/route.ts`
- ⚠️ `/app/api/user/[id]/insights/route.ts` (يحتاج إلى إصلاحات إضافية)

## سكريبت للبحث عن الملفات المتأثرة

```bash
# البحث عن جميع API routes التي تستخدم Promise في params
grep -r "params.*:.*Promise" --include="*.ts" app/api/
```

## ملاحظات مهمة

1. هذا التغيير مطلوب لجميع API Routes في Next.js 13+ App Router
2. يجب تطبيق نفس التغيير على جميع الدوال: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
3. إذا كان لديك أكثر من معامل في `params`، استخدم نفس الصيغة:
   ```typescript
   context: { params: { id: string, slug: string } }
   ```

## مراجع
- [Next.js App Router Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)

---
تم الإصلاح في: 2025-01-07 