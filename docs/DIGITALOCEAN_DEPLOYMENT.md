# دليل نشر التطبيق على DigitalOcean App Platform

## المتطلبات الأساسية

1. حساب DigitalOcean
2. مستودع GitHub متصل
3. قاعدة بيانات PlanetScale (أو MySQL متوافق)
4. حساب Cloudinary
5. **مهم**: استخدام Node.js 18.x أو 20.x (لا تستخدم 22)

## خطوات النشر

### 1. إعداد المتغيرات السرية

قم بإضافة المتغيرات التالية في DigitalOcean App Platform:

```bash
# متغيرات سرية (Encrypted)
DATABASE_URL=mysql://username:password@host/database?ssl={"rejectUnauthorized":true}
JWT_SECRET=your-jwt-secret-here
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
NEXTAUTH_SECRET=your-nextauth-secret
```

### 2. إعداد التطبيق

1. انتقل إلى [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. اضغط على "Create App"
3. اختر GitHub repository: `sabq4org/sabq-ai-cms`
4. **مهم**: اختر الفرع `clean-main` (ليس `main`)

### 3. تكوين البناء

استخدم الإعدادات التالية:

- **Build Command**: `npm run build:do`
- **Run Command**: `npm start`
- **HTTP Port**: `3000`
- **Node Version**: `18.x` (مهم: لا تستخدم Node 22)

### 4. حل المشاكل الشائعة

#### مشكلة DATABASE_URL أثناء البناء
إذا واجهت خطأ "DATABASE_URL is required":
- سكريبت البناء `build:do` يضع DATABASE_URL مؤقت تلقائياً
- تأكد من إضافة DATABASE_URL الحقيقي في متغيرات البيئة
- البناء سيعمل حتى بدون DATABASE_URL حقيقي، لكن التطبيق يحتاجه للعمل

#### مشكلة Prisma binaries
إذا واجهت خطأ في تحميل Prisma binaries:

```bash
Error: request to https://binaries.prisma.sh failed
```

الحل:
1. تأكد من وجود `PRISMA_CLI_BINARY_TARGETS='["debian-openssl-3.0.x"]'`
2. استخدم `npm run build:do` بدلاً من `npm run build`

#### مشكلة الذاكرة
إذا فشل البناء بسبب الذاكرة:
- قم بترقية instance size إلى `professional-s` على الأقل

#### مشكلة المتغيرات
تأكد من إضافة جميع المتغيرات المطلوبة في قسم Environment Variables

#### مفتاح OpenAI (اختياري)
- إذا لم يكن لديك مفتاح OpenAI، يمكن ترك `OPENAI_API_KEY` فارغاً
- التطبيق سيعمل بدون ميزات AI
- يمكن إضافة المفتاح لاحقاً من إعدادات النظام

### 5. البناء المحلي للاختبار

```bash
# محاكاة بيئة DigitalOcean محلياً
export NODE_ENV=production
export DATABASE_URL="your-database-url"
npm run build:do
```

### 6. مراقبة التطبيق

- استخدم Logs في DigitalOcean للمراقبة
- تحقق من Insights للأداء
- راقب استخدام الموارد

## ملاحظات مهمة

1. **قاعدة البيانات**: تأكد من أن PlanetScale يسمح بالاتصالات من DigitalOcean
2. **الصور**: جميع الصور تُرفع إلى Cloudinary، لا يوجد تخزين محلي
3. **الأمان**: لا تضع المتغيرات السرية في الكود أبداً
4. **النسخ الاحتياطي**: قم بعمل نسخ احتياطية دورية من PlanetScale

## الدعم

للمساعدة، راجع:
- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guides](https://www.prisma.io/docs/guides/deployment) 