# دليل الترحيل من MySQL إلى PostgreSQL

## التغييرات المطلوبة في Prisma Schema

### 1. تغيير Provider
```prisma
// من:
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"
}

// إلى:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. أنواع البيانات
PostgreSQL يتعامل مع أنواع البيانات بشكل مختلف عن MySQL. في معظم الحالات، يمكن إزالة التحديدات الصريحة:

- `@db.Text` → يمكن إزالته (PostgreSQL سيستخدم TEXT تلقائياً)
- `@db.VarChar(n)` → يمكن إزالته أو تغييره إلى `@db.VarChar(n)` (اختياري)
- `@db.Decimal(p,s)` → يبقى كما هو

### 3. العلاقات
مع PostgreSQL، لا نحتاج `relationMode = "prisma"` لأن PostgreSQL يدعم foreign keys مباشرة.

## الأوامر المطلوبة للترحيل

```bash
# 1. حذف ملفات Prisma القديمة
rm -rf node_modules/.prisma
rm -rf lib/generated/prisma

# 2. توليد Prisma Client الجديد
npx prisma generate

# 3. إنشاء migration جديد (للتطوير المحلي)
npx prisma migrate dev --name init-postgresql

# 4. أو نشر migrations موجودة (للإنتاج)
npx prisma migrate deploy
```

## ملاحظات مهمة

1. **البيانات الموجودة**: إذا كان لديك بيانات في MySQL تريد نقلها، ستحتاج أدوات خاصة للترحيل.

2. **الفهارس**: تأكد من أن جميع الفهارس تعمل بشكل صحيح مع PostgreSQL.

3. **JSON Fields**: PostgreSQL لديه دعم ممتاز لـ JSON/JSONB، لا تغيير مطلوب.

4. **UUIDs**: PostgreSQL يدعم UUID كنوع بيانات أصلي، وهو ممتاز للـ IDs. 