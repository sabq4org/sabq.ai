# إعداد Connection Pooling مع Supabase

## الوضع الحالي

لديك مشروعان مختلفان في Supabase:

1. **المشروع الحالي (يعمل)**: `uopckyrdhlvsxnvcobbw`
   - URL: `db.uopckyrdhlvsxnvcobbw.supabase.co`
   - يحتوي على البيانات الحالية

2. **مشروع Connection Pooling**: `apbkobhfnmcqqzqeeqss`
   - URL: `aws-0-eu-west-1.pooler.supabase.com`
   - مخصص لـ Connection Pooling

## كيفية تفعيل Connection Pooling للمشروع الحالي

### الخيار 1: استخدام Supavisor (موصى به)

1. **ادخل إلى لوحة تحكم Supabase**:
   ```
   https://app.supabase.com/project/uopckyrdhlvsxnvcobbw
   ```

2. **اذهب إلى Settings > Database**

3. **ابحث عن Connection Pooling**:
   - ستجد قسم "Connection pooling"
   - انسخ روابط الاتصال:
     - **Session mode** (منفذ 5432)
     - **Transaction mode** (منفذ 6543)

4. **حدث ملف `.env`**:
   ```env
   # Transaction mode (للتطبيقات Serverless)
   DATABASE_URL=postgres://postgres.uopckyrdhlvsxnvcobbw:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres
   
   # Session mode (للاتصالات الدائمة)
   DIRECT_URL=postgres://postgres.uopckyrdhlvsxnvcobbw:[PASSWORD]@[REGION].pooler.supabase.com:5432/postgres
   ```

### الخيار 2: نقل البيانات للمشروع الجديد

إذا كنت تريد استخدام المشروع `apbkobhfnmcqqzqeeqss`:

1. **تصدير البيانات من المشروع الحالي**:
   ```bash
   # تصدير البيانات
   pg_dump "postgresql://postgres:[YOUR_PASSWORD]@db.uopckyrdhlvsxnvcobbw.supabase.co:5432/postgres" > backup.sql
   ```

2. **استيراد البيانات للمشروع الجديد**:
   ```bash
   # استيراد البيانات
   psql "postgres://postgres.apbkobhfnmcqqzqeeqss:[YOUR_PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" < backup.sql
   ```

3. **حدث ملف `.env`** بالروابط الجديدة

## إعدادات Connection Pooling المثلى

### لتطبيقات Next.js (مثل مشروعك)

```env
# للتطبيق
DATABASE_URL=postgres://[USER]:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true

# للـ Migrations
DIRECT_URL=postgres://[USER]:[PASSWORD]@[HOST]:5432/postgres

# إعدادات إضافية
DATABASE_POOL_SIZE=25
DATABASE_CONNECTION_LIMIT=100
```

### إعدادات Prisma

في `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### إعدادات في `lib/prisma.ts`:

```typescript
// تعطيل prepared statements لـ Transaction mode
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // إعدادات للأداء الأفضل
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

## فوائد Connection Pooling

1. **أداء أفضل**: إعادة استخدام الاتصالات
2. **توسع أفضل**: دعم المزيد من المستخدمين المتزامنين
3. **استقرار أكثر**: تجنب أخطاء "too many connections"
4. **دعم Serverless**: مثالي لـ Vercel وغيرها

## نصائح مهمة

1. **لا تستخدم Transaction mode مع**:
   - Prepared statements
   - Session-level features
   - Long transactions

2. **استخدم Session mode عندما**:
   - تحتاج prepared statements
   - تحتاج اتصالات طويلة المدى

3. **مراقبة الأداء**:
   - راقب عدد الاتصالات من Supabase Dashboard
   - استخدم `pg_stat_activity` لمراقبة الاتصالات النشطة

## اختبار الاتصال

```bash
# اختبر الاتصال الجديد
node scripts/test-db-connection.js

# أو استخدم psql
psql "YOUR_CONNECTION_STRING"
```

## المساعدة

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management) 