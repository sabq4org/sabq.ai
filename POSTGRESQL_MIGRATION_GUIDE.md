# دليل الترحيل من PlanetScale MySQL إلى DigitalOcean PostgreSQL

## ✅ الحالة الحالية:
- **قاعدة البيانات الجديدة**: PostgreSQL 17.5 على DigitalOcean
- **الاتصال**: ناجح ✓
- **الجداول**: لم يتم إنشاؤها بعد

## 📋 خطوات الترحيل:

### 1. إنشاء ملف البيئة المحلي:
قم بإنشاء ملف `.env.local` وأضف:
```env
DATABASE_URL="postgresql://doadmin:[YOUR_PASSWORD]@db-sabq-ai-1755-do-user-23559731-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

### 2. نسخ احتياطية من البيانات الحالية:
```bash
# تشغيل نسخة احتياطية كاملة
npm run backup:full
```

### 3. تشغيل سكريبت الترحيل:
```bash
chmod +x scripts/migrate-planetscale-to-postgres.sh
./scripts/migrate-planetscale-to-postgres.sh
```

### 4. التحقق من الترحيل:
```bash
# فحص الجداول
node scripts/test-postgres-connection.js

# فتح Prisma Studio
npx prisma studio
```

### 5. تحديث الإنتاج:

#### أ. في DigitalOcean App Platform:
1. اذهب إلى Settings > Environment Variables
2. حدث `DATABASE_URL` إلى:
```
postgresql://doadmin:[YOUR_PASSWORD]@private-db-sabq-ai-1755-do-user-23559731-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```
(لاحظ استخدام `private-` للاتصال الداخلي)

#### ب. نشر التحديثات:
```bash
git add .
git commit -m "الترحيل إلى PostgreSQL على DigitalOcean"
git push origin main
```

## ⚠️ ملاحظات مهمة:

### 1. الفروقات بين MySQL و PostgreSQL:
- **الأنواع**: بعض الأنواع مختلفة (مثل `TINYINT` → `SMALLINT`)
- **الفهارس**: PostgreSQL أكثر ذكاءً في الفهارس
- **JSON**: PostgreSQL لديه دعم أفضل لـ JSON

### 2. تحديثات Prisma Schema:
- تم تغيير `provider` من `mysql` إلى `postgresql`
- تم إزالة `relationMode = "prisma"`
- قد تحتاج بعض الأنواع للتعديل

### 3. الأداء:
- PostgreSQL عادة أسرع للاستعلامات المعقدة
- الاتصال من نفس مركز البيانات = أداء ممتاز

## 🔧 استكشاف الأخطاء:

### خطأ في الاتصال:
```bash
# تحقق من IP في Trusted Sources
# استخدم سكريبت الاختبار:
node scripts/test-postgres-connection.js
```

### خطأ في الترحيل:
```bash
# تحقق من النسخة الاحتياطية
ls -la backups/migration-*/

# أعد محاولة الاستيراد
cd backups/migration-[التاريخ]
node import-data.js
```

### خطأ في Prisma:
```bash
# أعد توليد العميل
npx prisma generate

# تحقق من الـ Schema
npx prisma validate
```

## 📊 مقارنة التكاليف:
- **PlanetScale Scaler**: $29/شهر
- **DigitalOcean PostgreSQL**: $15/شهر
- **التوفير**: $14/شهر (48%)

## 🚀 المزايا:
1. **أداء أفضل**: نفس مركز البيانات
2. **تكلفة أقل**: توفير 48%
3. **إدارة أسهل**: كل شيء في مكان واحد
4. **PostgreSQL**: قاعدة بيانات أقوى وأكثر مرونة 