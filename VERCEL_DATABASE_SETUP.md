# دليل إعداد قاعدة البيانات على Vercel

## 🚨 المشكلة الحالية
الموقع يعمل على Vercel لكن API endpoints تفشل بسبب عدم إعداد قاعدة البيانات. الخطأ:
```
Invalid `prisma.category.findMany()` invocation:
... the protocol `prisma://` or `prisma+postgres://`
```

## ✅ الحلول المتاحة

### الحل الأول: استخدام Vercel Postgres (مجاني)

#### 1. إنشاء قاعدة البيانات
```bash
# في لوحة تحكم Vercel
1. اذهب إلى مشروع sabq-ai-cms
2. اختر تبويب "Storage"
3. انقر "Create Database"
4. اختر "Postgres"
5. اختر خطة Hobby (مجانية)
6. أنشئ القاعدة
```

#### 2. ربط قاعدة البيانات بالمشروع
```bash
# سيتم إضافة متغيرات البيئة تلقائياً:
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="prisma://..."
POSTGRES_URL_NON_POOLING="postgres://..."
```

#### 3. تحديث متغيرات البيئة
في Vercel Dashboard > Settings > Environment Variables:
```env
DATABASE_URL=$POSTGRES_PRISMA_URL
JWT_SECRET=your-super-secret-jwt-key-2024
ADMIN_SECRET=admin-secret-2024
CLOUDINARY_CLOUD_NAME=dybhezmvb
CLOUDINARY_API_KEY=559894124915114
CLOUDINARY_API_SECRET=vuiA8rLNm7d1U-UAOTED6FyC4hY
```

### الحل الثاني: استخدام PlanetScale (مجاني)

#### 1. إنشاء حساب على PlanetScale
```bash
1. اذهب إلى https://planetscale.com
2. أنشئ حساب جديد
3. أنشئ قاعدة بيانات جديدة
4. احصل على connection string
```

#### 2. إعداد متغيرات البيئة
```env
DATABASE_URL="mysql://username:password@host/database?sslaccept=strict"
JWT_SECRET=your-super-secret-jwt-key-2024
ADMIN_SECRET=admin-secret-2024
```

### الحل الثالث: استخدام Neon (PostgreSQL مجاني)

#### 1. إنشاء قاعدة البيانات على Neon
```bash
1. اذهب إلى https://neon.tech
2. أنشئ حساب جديد
3. أنشئ مشروع جديد
4. احصل على connection string
```

#### 2. إعداد متغيرات البيئة
```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
JWT_SECRET=your-super-secret-jwt-key-2024
ADMIN_SECRET=admin-secret-2024
```

## 🔧 خطوات تشغيل Migration

### الطريقة الأولى: تلقائياً (موصى بها)
```bash
# سيتم تشغيل migration تلقائياً عند النشر
# بفضل postbuild script في package.json:
"postbuild": "npx prisma db push --accept-data-loss"
```

### الطريقة الثانية: عبر API
```bash
curl -X POST https://sabq-ai-cms.vercel.app/api/admin/migrate-db \
  -H "Content-Type: application/json" \
  -d '{"secret":"admin-secret-2024"}'
```

### الطريقة الثالثة: عبر Vercel CLI
```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# ربط المشروع
vercel link

# تشغيل migration
vercel env pull .env.local
npx prisma db push
```

## 📋 قائمة التحقق

### ✅ متغيرات البيئة المطلوبة
- [ ] DATABASE_URL
- [ ] JWT_SECRET  
- [ ] ADMIN_SECRET
- [ ] CLOUDINARY_CLOUD_NAME
- [ ] CLOUDINARY_API_KEY
- [ ] CLOUDINARY_API_SECRET

### ✅ خطوات النشر
1. [ ] إعداد قاعدة البيانات
2. [ ] إضافة متغيرات البيئة في Vercel
3. [ ] إعادة نشر المشروع
4. [ ] تشغيل migration
5. [ ] اختبار API endpoints

## 🚀 إعادة النشر

بعد إعداد قاعدة البيانات:
```bash
# في Vercel Dashboard
1. اذهب إلى تبويب "Deployments"
2. انقر "Redeploy" على آخر deployment
3. اختر "Use existing Build Cache: No"
4. انقر "Redeploy"
```

## 🧪 اختبار النظام

### اختبار قاعدة البيانات
```bash
curl https://sabq-ai-cms.vercel.app/api/health
```

### اختبار الفئات
```bash
curl https://sabq-ai-cms.vercel.app/api/categories
```

### اختبار رفع الصور
```bash
# اختبار عبر الواجهة أو:
curl -X POST https://sabq-ai-cms.vercel.app/api/upload \
  -F "file=@test-image.jpg"
```

## 📞 الدعم

إذا واجهت مشاكل:
1. تحقق من Vercel Function Logs
2. تحقق من متغيرات البيانات
3. تأكد من صحة connection string
4. جرب إعادة النشر مع تنظيف الكاش

## 🎯 التوصية

**الحل الأسرع**: استخدم Vercel Postgres لأنه:
- مدمج مع Vercel
- إعداد تلقائي لمتغيرات البيئة
- مجاني للمشاريع الصغيرة
- دعم فني ممتاز 