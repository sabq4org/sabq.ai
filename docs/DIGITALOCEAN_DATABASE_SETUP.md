# دليل إعداد قاعدة بيانات DigitalOcean

## 1. إنشاء قاعدة البيانات على DigitalOcean

### الخطوات:

1. **من لوحة تحكم DigitalOcean:**
   - اذهب إلى "Databases"
   - انقر على "Create Database Cluster"

2. **اختر الإعدادات:**
   ```
   Database Engine: MySQL 8
   Cluster configuration: Basic ($15/month)
   - 1 GB RAM / 1 vCPU
   - 10 GB Disk
   - Primary only (يمكن إضافة replicas لاحقاً)
   
   Datacenter: نفس منطقة Droplet الخاص بك
   VPC Network: نفس VPC للتطبيق
   ```

3. **الأمان:**
   - أضف Droplet الخاص بك إلى "Trusted Sources"
   - هذا يسمح بالاتصال عبر الشبكة الخاصة فقط

## 2. تصدير البيانات من PlanetScale

### باستخدام PlanetScale CLI:
```bash
# تثبيت PlanetScale CLI
brew install planetscale/tap/pscale

# تسجيل الدخول
pscale auth login

# تصدير قاعدة البيانات
pscale database dump <database-name> <branch-name> --output backup.sql
```

### أو باستخدام mysqldump:
```bash
# احصل على بيانات الاتصال من PlanetScale dashboard
mysqldump -h <host>.psdb.cloud \
  -u <username> \
  -p<password> \
  --ssl-mode=REQUIRED \
  --set-gtid-purged=OFF \
  --no-tablespaces \
  --single-transaction \
  <database_name> > planetscale_backup.sql
```

## 3. استيراد البيانات إلى DigitalOcean

### من Droplet الخاص بك:
```bash
# الاتصال بقاعدة البيانات الجديدة
mysql -h <private-host> \
  -P 25060 \
  -u doadmin \
  -p<password> \
  defaultdb < planetscale_backup.sql
```

### أو استخدم أداة الاستيراد في لوحة التحكم:
- اذهب إلى قاعدة البيانات > "Import Data"
- ارفع ملف SQL

## 4. تحديث إعدادات المشروع

### تحديث `.env.local`:
```env
# قبل (PlanetScale)
DATABASE_URL="mysql://username:password@host.psdb.cloud/database?ssl={"rejectUnauthorized":true}"

# بعد (DigitalOcean)
DATABASE_URL="mysql://doadmin:password@private-db-host:25060/defaultdb?ssl-mode=REQUIRED"
```

### للاتصال الآمن عبر SSL:
```env
# إضافة شهادة SSL
DATABASE_URL="mysql://doadmin:password@private-db-host:25060/defaultdb?ssl-mode=REQUIRED&ssl-ca=/path/to/ca-certificate.crt"
```

## 5. اختبار الاتصال

### من Droplet:
```bash
# اختبار الاتصال
mysql -h private-db-host -P 25060 -u doadmin -p

# من داخل MySQL
SHOW DATABASES;
USE defaultdb;
SHOW TABLES;
```

### من التطبيق:
```bash
# اختبار Prisma
npx prisma db pull
npx prisma generate

# تشغيل التطبيق
npm run dev
```

## 6. تحسينات الأداء

### استخدام Connection Pooling:
```javascript
// في prisma.ts
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling
  connectionLimit: 10,
});
```

### استخدام الشبكة الخاصة:
- استخدم `private-db-host` بدلاً من `public-db-host`
- هذا يحسن الأداء ويزيد الأمان

## 7. النسخ الاحتياطي

### تفعيل النسخ الاحتياطي التلقائي:
- من لوحة التحكم > قاعدة البيانات > Settings
- فعّل "Daily backups"
- احتفاظ لمدة 7 أيام (مجاني)

### نسخ احتياطي يدوي:
```bash
# من Droplet
mysqldump -h private-db-host \
  -P 25060 \
  -u doadmin \
  -p \
  defaultdb > backup_$(date +%Y%m%d_%H%M%S).sql

# ضغط النسخة
gzip backup_*.sql
```

## 8. المراقبة

### من لوحة تحكم DigitalOcean:
- CPU Usage
- Memory Usage
- Disk I/O
- Connection count

### تنبيهات:
- أعد تنبيهات للاستخدام العالي
- راقب slow queries

## مقارنة التكلفة

| الخدمة | الخطة | السعر الشهري | المميزات |
|--------|-------|--------------|------------|
| PlanetScale | Hobby | $0 | 5GB storage, محدود |
| PlanetScale | Scaler | $29 | 10GB storage, غير محدود |
| DigitalOcean | Basic | $15 | 10GB storage, نسخ احتياطي مجاني |
| DigitalOcean | Professional | $60 | 25GB storage, standby node |

## نصائح مهمة

1. **ابدأ بخطة Basic**: $15/شهر كافية للتطوير والاختبار
2. **استخدم الشبكة الخاصة**: أسرع وأكثر أماناً
3. **فعّل النسخ الاحتياطي**: مجاني ومهم
4. **راقب الأداء**: لتحديد وقت الترقية
5. **احتفظ بنسخة من PlanetScale**: لمدة أسبوع على الأقل

## استكشاف الأخطاء

### خطأ في الاتصال:
```bash
# تحقق من Trusted Sources
# تأكد من استخدام الـ Private Network hostname
# تحقق من فتح المنفذ 25060
```

### بطء في الأداء:
```bash
# تحقق من استخدام الـ indexes
# راجع slow query log
# فكر في الترقية إذا لزم الأمر
``` 