# إعدادات قاعدة البيانات - خادم jur3a.ai

## معلومات الاتصال

### في ملف .env أو .env.local:
```env
DATABASE_URL="mysql://j3uar_sabq_user:hugsiP-tiswaf-vitte2@jur3a.ai:3306/j3uar_sabq_db"
```

### تفاصيل الاتصال:
- **الخادم**: jur3a.ai
- **المنفذ**: 3306 (MySQL الافتراضي)
- **قاعدة البيانات**: j3uar_sabq_db
- **المستخدم**: j3uar_sabq_user
- **كلمة المرور**: hugsiP-tiswaf-vitte2

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