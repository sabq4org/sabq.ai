# إعدادات قاعدة البيانات - خادم jur3a.ai

## معلومات الاتصال

### في ملف .env أو .env.local:
```env
DATABASE_URL="mysql://username:password@host:3306/database_name"
```

### تفاصيل الاتصال:
- **الخادم**: [YOUR_HOST]
- **المنفذ**: 3306 (MySQL الافتراضي)
- **قاعدة البيانات**: [YOUR_DATABASE_NAME]
- **المستخدم**: [YOUR_USERNAME]
- **كلمة المرور**: [YOUR_PASSWORD]

## خطوات الإعداد

### 1. تحديث Prisma Schema ✅
تم تحديث `prisma/schema.prisma` لاستخدام MySQL

### 2. توليد Prisma Client
```bash
npx prisma generate
```

### 3. إنشاء الجداول في قاعدة البيانات
```bash
npx prisma db push
```

### 4. (اختياري) نقل البيانات من JSON
```bash
npm run db:migrate
```

## حل المشاكل المحتملة

### خطأ: Connection refused
- تأكد من أن الخادم يسمح بالاتصالات الخارجية
- قد تحتاج لإضافة IP جهازك في whitelist من cPanel

### خطأ: Authentication failed
- تأكد من صحة اسم المستخدم وكلمة المرور
- تحقق من صلاحيات المستخدم على قاعدة البيانات

### للحصول على IP جهازك:
```bash
curl ifconfig.me
```

## ملاحظات مهمة

1. **الأمان**: لا تشارك معلومات الاتصال في GitHub
2. **النسخ الاحتياطي**: خذ نسخة احتياطية قبل أي تغييرات كبيرة
3. **البيئات**: استخدم قاعدة بيانات مختلفة للتطوير والإنتاج

## للتطوير المحلي (بديل)

إذا كنت تريد العمل بدون اتصال بالخادم:
```env
# SQLite للتطوير المحلي
DATABASE_URL="file:./dev.db"
```

وغيّر provider في schema.prisma إلى "sqlite" 