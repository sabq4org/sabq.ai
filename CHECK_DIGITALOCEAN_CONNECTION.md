# التحقق من معلومات الاتصال الصحيحة من DigitalOcean

## كيفية الحصول على معلومات الاتصال الصحيحة:

1. **افتح لوحة تحكم DigitalOcean**:
   https://cloud.digitalocean.com/databases

2. **اختر قاعدة البيانات** `db-sabq`

3. **في صفحة Overview، ابحث عن قسم "Connection Details"**

4. **انسخ المعلومات التالية بدقة**:
   - **Host**: (يجب أن يكون بصيغة مثل `db-sabq-xxx.b.db.ondigitalocean.com`)
   - **Port**: 25060
   - **Database**: defaultdb
   - **User**: doadmin
   - **Password**: AVNS_xxxxx

## أشكال محتملة لاسم المضيف:
- `db-sabq.b.db.ondigitalocean.com`
- `db-sabq-nyc3-01.b.db.ondigitalocean.com`
- `db-postgresql-nyc3-xxxxx.b.db.ondigitalocean.com`

## تنبيه مهم:
لاحظ أن اسم المضيف يحتوي على `.b.` وليس `.h.` قبل `db.ondigitalocean.com`

## بعد الحصول على المعلومات الصحيحة:
```bash
# حدث ملف .env
DATABASE_URL="postgresql://doadmin:AVNS_YOUR_PASSWORD@CORRECT_HOST:25060/defaultdb?sslmode=require"
DIRECT_URL="postgresql://doadmin:AVNS_YOUR_PASSWORD@CORRECT_HOST:25060/defaultdb?sslmode=require"
```

## اختبار الاتصال:
```bash
npx prisma db pull
``` 