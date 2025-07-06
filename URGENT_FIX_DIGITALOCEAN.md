# حل عاجل - مشكلة الاتصال بقاعدة البيانات DigitalOcean

## الخطوة 1: إضافة عنوان IP في DigitalOcean (مهم جداً!)

1. افتح https://cloud.digitalocean.com/databases
2. اختر قاعدة البيانات `db-sabq`
3. اذهب إلى **Settings** > **Trusted Sources**
4. اضغط **Edit**
5. أضف: `176.45.56.154`
6. اضغط **Save**

## الخطوة 2: إنشاء ملف .env (إذا لم يكن موجوداً)

```bash
# في Terminal
echo 'DATABASE_URL="postgresql://doadmin:AVNS_YOUR_PASSWORD@db-sabq-do-user-18651948-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require"' > .env
echo 'NEXT_PUBLIC_SITE_URL=http://localhost:3000' >> .env
echo 'NEXT_PUBLIC_API_URL=http://localhost:3000/api' >> .env
```

**مهم**: استبدل `AVNS_YOUR_PASSWORD` بكلمة المرور الفعلية من DigitalOcean

## الخطوة 3: اختبار سريع

```bash
# توليد Prisma Client
npx prisma generate

# اختبار الاتصال
npx prisma db pull
```

## الخطوة 4: تشغيل التطبيق

```bash
npm run dev
```

## إذا ظهرت رسالة خطأ SSL

جرب في Terminal:
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
npm run dev
```

## معلومات الاتصال

- **Host**: db-sabq-do-user-18651948-0.h.db.ondigitalocean.com
- **Port**: 25060
- **Database**: defaultdb
- **User**: doadmin
- **SSL**: مطلوب (required)

## للحصول على كلمة المرور

1. اذهب إلى https://cloud.digitalocean.com/databases
2. اختر `db-sabq`
3. في قسم **Connection Details**
4. انسخ كلمة المرور من حقل **Password**

## ملاحظة مهمة

إذا كنت تعمل من جهاز مختلف أو تغير عنوان IP الخاص بك، يجب إضافة العنوان الجديد في Trusted Sources. 