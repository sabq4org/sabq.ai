# دليل إصلاح الاتصال بقاعدة البيانات على DigitalOcean

## 1. إضافة عنوان IP الخاص بك في DigitalOcean

يجب إضافة عنوان IP الخاص بك: **176.45.56.154** إلى قائمة Trusted Sources في DigitalOcean:

1. افتح [DigitalOcean Control Panel](https://cloud.digitalocean.com/databases)
2. اختر قاعدة البيانات `db-sabq`
3. انتقل إلى تبويب **Settings**
4. في قسم **Trusted Sources**، اضغط على **Edit**
5. أضف عنوان IP: `176.45.56.154`
6. اضغط **Save**

## 2. إنشاء ملف .env.local

أنشئ ملف `.env.local` في المجلد الرئيسي للمشروع:

```bash
# للاتصال من جهازك المحلي
DATABASE_URL="postgresql://doadmin:AVNS_[YOUR_PASSWORD]@db-sabq-do-user-18651948-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

# للاتصال من داخل DigitalOcean
# DATABASE_URL="postgresql://doadmin:AVNS_[YOUR_PASSWORD]@private-db-sabq-do-user-18651948-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 3. تحديث Prisma Schema

تأكد من أن `prisma/schema.prisma` يستخدم PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 4. اختبار الاتصال

```bash
# اختبار الاتصال
node scripts/test-postgres-connection-safe.js

# تشغيل migrations
npx prisma migrate deploy

# إنشاء Prisma Client
npx prisma generate
```

## 5. إذا استمرت المشكلة

### أ. تعطيل SSL مؤقتاً (للتطوير فقط):
```
DATABASE_URL="postgresql://doadmin:AVNS_[YOUR_PASSWORD]@db-sabq-do-user-18651948-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=disable"
```

### ب. استخدام Connection Pooling:
```
DATABASE_URL="postgresql://doadmin:AVNS_[YOUR_PASSWORD]@db-sabq-do-user-18651948-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require&connection_limit=5"
```

### ج. التحقق من الشهادات:
```bash
# لنظام macOS
export NODE_TLS_REJECT_UNAUTHORIZED=0
npm run dev
```

## 6. البيئة الإنتاجية على DigitalOcean

في App Platform، تأكد من إضافة متغيرات البيئة:

```
DATABASE_URL=postgresql://doadmin:AVNS_[YOUR_PASSWORD]@private-db-sabq-do-user-18651948-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require
NEXT_PUBLIC_SITE_URL=https://your-app.ondigitalocean.app
NEXT_PUBLIC_API_URL=https://your-app.ondigitalocean.app/api
```

## 7. نصائح مهمة

- استخدم `private-` prefix عند الاتصال من داخل DigitalOcean
- استخدم العنوان العام عند الاتصال من خارج DigitalOcean
- تأكد من إضافة جميع عناوين IP المطلوبة في Trusted Sources
- احتفظ بنسخة احتياطية من كلمة المرور في مكان آمن 