# دليل إعداد MySQL المحلي مع phpMyAdmin

## 🚀 خطوات سريعة

### 1. إنشاء قاعدة البيانات في phpMyAdmin
```sql
-- في phpMyAdmin، شغّل هذا الأمر:
CREATE DATABASE sabq_local_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. تحديث ملف .env
افتح ملف `.env` وغيّر DATABASE_URL إلى:

```env
# لـ XAMPP/WAMP (المنفذ 3306)
DATABASE_URL="mysql://root@localhost:3306/sabq_local_db"

# لـ MAMP (المنفذ 8889)
DATABASE_URL="mysql://root:root@localhost:8889/sabq_local_db"

# إذا كان لديك كلمة مرور
DATABASE_URL="mysql://root:your_password@localhost:3306/sabq_local_db"
```

### 3. تشغيل Prisma Migrations
```bash
# توليد Prisma Client
npx prisma generate

# تشغيل Migrations
npx prisma migrate dev --name init

# أو إذا كنت تريد إنشاء الجداول فقط بدون migrations
npx prisma db push
```

### 4. التحقق من الجداول
في phpMyAdmin، يجب أن ترى هذه الجداول:
- users
- categories
- articles
- interactions
- loyalty_points
- deep_analyses
- smart_blocks
- messages
- activity_logs
- roles
- user_roles
- templates
- comments
- statistics

## 🛠️ حل المشاكل الشائعة

### خطأ Authentication failed
```bash
Error: P1000: Authentication failed
```
**الحل:** تأكد من:
- اسم المستخدم الصحيح (عادة `root`)
- كلمة المرور الصحيحة (فارغة أو `root` لـ MAMP)
- المنفذ الصحيح (3306 أو 8889)

### خطأ Can't connect to MySQL server
```bash
Error: P1001: Can't reach database server
```
**الحل:** تأكد من:
- تشغيل MySQL في XAMPP/MAMP/WAMP
- المنفذ الصحيح في DATABASE_URL

### خطأ Unknown database
```bash
Error: P1003: Database sabq_local_db does not exist
```
**الحل:** أنشئ قاعدة البيانات في phpMyAdmin أولاً

## 📝 أوامر مفيدة

```bash
# عرض الجداول
npx prisma studio

# إعادة تعيين قاعدة البيانات
npx prisma migrate reset

# تحديث Prisma Client بعد تغيير Schema
npx prisma generate

# مزامنة Schema مع قاعدة البيانات
npx prisma db pull
```

## ✅ الخطوة التالية
بعد نجاح الإعداد، يمكنك:
1. فتح Prisma Studio: `npx prisma studio`
2. إضافة بيانات تجريبية
3. البدء في استخدام Prisma في الكود 