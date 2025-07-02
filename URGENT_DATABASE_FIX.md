# 🚨 حل عاجل - مشكلة نوع قاعدة البيانات

## المشكلة المكتشفة
```json
{
  "error": "the URL must start with the protocol `prisma://` or `prisma+postgres://`",
  "database_url_preview": "mysql://5k3qivqt4ihe..."
}
```

**السبب**: قاعدة البيانات الحالية MySQL لكن المشروع مُعد لـ PostgreSQL

## 🎯 الحل السريع (خيارين)

### الخيار الأول: إنشاء قاعدة بيانات PostgreSQL جديدة (موصى به)

#### 1. في Vercel Dashboard:
1. اذهب إلى https://vercel.com/dashboard
2. اختر مشروع `sabq-ai-cms`
3. تبويب **"Storage"**
4. انقر **"Create Database"**
5. اختر **"Postgres"** (وليس MySQL)
6. اختر **"Hobby (Free)"**
7. اسم القاعدة: `sabq-postgres-db`
8. انقر **"Create"**

#### 2. تحديث متغيرات البيئة:
بعد إنشاء PostgreSQL، ستحصل على متغيرات جديدة:
```env
DATABASE_URL=$POSTGRES_PRISMA_URL
# أو
DATABASE_URL=$POSTGRES_URL
```

### الخيار الثاني: تحديث المشروع لدعم MySQL

#### 1. تحديث Prisma Schema:
```prisma
// في prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"  // بدلاً من postgresql
  url      = env("DATABASE_URL")
}
```

#### 2. إعادة generate Prisma Client:
```bash
npx prisma generate
npx prisma db push
```

## 🚀 التنفيذ السريع

### للخيار الأول (PostgreSQL - موصى به):
1. أنشئ قاعدة PostgreSQL في Vercel
2. انسخ `POSTGRES_PRISMA_URL` من Storage settings
3. في Environment Variables:
   ```env
   DATABASE_URL=$POSTGRES_PRISMA_URL
   ```
4. Redeploy المشروع

### للخيار الثاني (MySQL):
1. في متغيرات البيئة، استخدم:
   ```env
   DATABASE_URL=mysql://5k3qivqt4ihe...  # الرابط الحالي
   ```
2. سأحدث Prisma schema للمشروع

## 🧪 اختبار النتيجة
```bash
# بعد التطبيق
curl https://sabq-ai-cms.vercel.app/api/test-db
curl https://sabq-ai-cms.vercel.app/api/categories
```

## 📞 أيهما تفضل؟
- **PostgreSQL**: أفضل، متوافق مع الإعدادات الحالية
- **MySQL**: أسرع، لكن يحتاج تعديل الكود

**توصيتي**: PostgreSQL لأنه لن يحتاج تغيير أي كود! 