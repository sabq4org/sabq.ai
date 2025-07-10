# دليل إعداد البيئة - سبق الذكية CMS

## 🚀 نظرة عامة

هذا الدليل يوضح كيفية إعداد متغيرات البيئة لمشروع **سبق الذكية CMS**. يجب إعداد جميع المتغيرات المطلوبة قبل تشغيل التطبيق.

## 📋 قائمة المراجعة السريعة

### ✅ المتطلبات الأساسية
- [ ] قاعدة بيانات PostgreSQL
- [ ] Redis للتخزين المؤقت
- [ ] Supabase للبيانات والتخزين
- [ ] Cloudinary للوسائط
- [ ] OpenAI API للذكاء الاصطناعي
- [ ] خدمة البريد الإلكتروني (SMTP)

### ✅ الإعدادات الأمنية
- [ ] مفاتيح تشفير قوية
- [ ] كلمات مرور آمنة
- [ ] تمكين المصادقة ثنائية العامل
- [ ] تكوين CORS بشكل صحيح

## 🔧 خطوات الإعداد

### 1. إنشاء ملف البيئة
```bash
cp env.example.updated .env.local
```

### 2. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة بيانات PostgreSQL
createdb sabq_ai_cms
createdb sabq_ai_cms_test

# تحديث DATABASE_URL في .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/sabq_ai_cms?schema=public"
```

### 3. إعداد Supabase
1. أنشئ مشروع جديد في [Supabase](https://supabase.com)
2. انسخ URL و API Keys
3. أضف المتغيرات إلى `.env.local`:
```env
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### 4. إعداد Cloudinary
1. أنشئ حساب في [Cloudinary](https://cloudinary.com)
2. انسخ Cloud Name و API Keys
3. أضف المتغيرات إلى `.env.local`:
```env
CLOUDINARY_CLOUD_NAME="sabq-ai"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### 5. إعداد OpenAI
1. احصل على API Key من [OpenAI](https://platform.openai.com)
2. أضف المتغير إلى `.env.local`:
```env
OPENAI_API_KEY="your-openai-api-key"
```

### 6. إعداد المصادقة
```env
NEXTAUTH_SECRET="your-super-secret-key-here-change-this-in-production"
JWT_SECRET="your-jwt-secret-key-here-change-this-in-production"
ENCRYPTION_KEY="your-32-character-encryption-key-here"
```

## 🔐 الأمان

### مفاتيح التشفير
```bash
# إنشاء مفتاح تشفير آمن
openssl rand -hex 32

# إنشاء JWT secret
openssl rand -base64 32

# إنشاء NextAuth secret
openssl rand -base64 32
```

### كلمات المرور
- استخدم كلمات مرور معقدة (12+ حرف)
- امزج بين الأحرف الكبيرة والصغيرة والأرقام والرموز
- لا تستخدم نفس كلمة المرور لعدة خدمات

## 🌍 البيئات المختلفة

### التطوير (Development)
```env
NODE_ENV="development"
ENABLE_DEBUG="true"
LOG_LEVEL="debug"
```

### الإنتاج (Production)
```env
NODE_ENV="production"
ENABLE_DEBUG="false"
LOG_LEVEL="info"
ENABLE_SECURITY_HEADERS="true"
ENABLE_CSRF_PROTECTION="true"
```

### الاختبار (Testing)
```env
NODE_ENV="test"
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/sabq_ai_cms_test?schema=public"
```

## 📊 الخدمات الاختيارية

### التحليلات
```env
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
FACEBOOK_PIXEL_ID="your-facebook-pixel-id"
```

### المراقبة
```env
SENTRY_DSN="your-sentry-dsn"
```

### الدفع
```env
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
```

### البحث
```env
ALGOLIA_APP_ID="your-algolia-app-id"
ALGOLIA_API_KEY="your-algolia-api-key"
```

## 🚨 تحذيرات مهمة

### ❌ لا تفعل أبداً
- لا تضع مفاتيح API الحقيقية في الكود
- لا تشارك ملف `.env` مع الآخرين
- لا تحفظ ملف `.env` في نظام التحكم بالإصدارات

### ✅ أفضل الممارسات
- استخدم ملفات `.env` منفصلة لكل بيئة
- قم بتدوير المفاتيح بانتظام
- استخدم خدمات إدارة الأسرار في الإنتاج
- فعل المصادقة ثنائية العامل على جميع الخدمات

## 🔍 التحقق من الإعداد

### اختبار الاتصال
```bash
# تشغيل اختبار البيئة
npm run test:env

# تشغيل اختبار قاعدة البيانات
npm run test:db

# تشغيل اختبار الخدمات الخارجية
npm run test:services
```

### التحقق من الأمان
```bash
# فحص نقاط الضعف
npm audit

# فحص التبعيات
npm run security:check

# فحص تكوين الأمان
npm run security:config
```

## 📚 مراجع إضافية

### المستندات
- [دليل قاعدة البيانات](./docs/DATABASE_SETUP_GUIDE.md)
- [دليل التكاملات](./docs/INTEGRATIONS_README.md)
- [دليل الأمان](./docs/SECURITY_GUIDE.md)

### الخدمات الخارجية
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)

## 🆘 المساعدة والدعم

### الأخطاء الشائعة
1. **خطأ اتصال قاعدة البيانات**: تحقق من `DATABASE_URL`
2. **خطأ Supabase**: تأكد من صحة `SUPABASE_URL` و `SUPABASE_ANON_KEY`
3. **خطأ Cloudinary**: تحقق من `CLOUDINARY_CLOUD_NAME` و API Keys
4. **خطأ OpenAI**: تأكد من صحة `OPENAI_API_KEY`

### الحصول على المساعدة
- افتح Issue في GitHub
- راجع ملفات التوثيق
- تحقق من لوجات الأخطاء

## 📝 ملاحظات التحديث

### الإصدار الحالي: 1.0.0
- إضافة دعم متغيرات البيئة الجديدة
- تحسين أمان التكوين
- إضافة دعم الخدمات الإضافية

### التحديثات المستقبلية
- [ ] إضافة دعم Docker
- [ ] تحسين عملية النشر
- [ ] إضافة مراقبة أفضل
- [ ] تحسين الأداء

---

> **تذكير**: هذا الملف يحتوي على معلومات حساسة. لا تشاركه مع أشخاص غير مخولين ولا تحفظه في نظام التحكم بالإصدارات. 