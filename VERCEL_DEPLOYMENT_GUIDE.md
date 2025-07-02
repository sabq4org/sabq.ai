# دليل النشر في Vercel - Sabq AI CMS

## 📋 المتطلبات الأساسية

### متغيرات البيئة المطلوبة في Vercel

```bash
# قاعدة البيانات
DATABASE_URL=mysql://username:password@host:port/database?sslaccept=strict

# الأمان
JWT_SECRET=your-super-secret-jwt-key-here

# Cloudinary (اختياري)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# NextAuth (اختياري)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.vercel.app
```

## 🚀 خطوات النشر

### 1. رفع الكود إلى GitHub

```bash
git add .
git commit -m "تحسينات النشر في Vercel"
git push origin main
```

### 2. ربط المشروع بـ Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. انقر على "New Project"
3. اختر مستودع GitHub الخاص بك
4. تأكد من الإعدادات التالية:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (افتراضي)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. إضافة متغيرات البيئة

في إعدادات المشروع في Vercel:
1. اذهب إلى **Settings** > **Environment Variables**
2. أضف جميع المتغيرات المطلوبة أعلاه
3. تأكد من تحديد **Production** و **Preview** لكل متغير

### 4. إعدادات البناء المحسنة

المشروع يتضمن:
- ✅ سكريبت تحسين البناء: `scripts/vercel-build-optimization.js`
- ✅ سكريبت التحقق من الجاهزية: `scripts/vercel-deploy-check.js`
- ✅ ملف `.nvmrc` لتحديد إصدار Node.js
- ✅ ملف `.vercelignore` لتحسين البناء

## 🔧 حل المشاكل الشائعة

### خطأ: Process completed with exit code 1

#### الأسباب المحتملة:
1. **متغيرات البيئة مفقودة**
2. **مشاكل في قاعدة البيانات**
3. **مشاكل في Prisma Client**
4. **مشاكل في الذاكرة**

#### الحلول:

##### 1. التحقق من متغيرات البيئة
```bash
# تشغيل سكريبت التحقق محلياً
npm run vercel:check
```

##### 2. إصلاح مشاكل Prisma
```bash
# تنظيف وإعادة توليد Prisma Client
rm -rf lib/generated
npm run prisma:generate
```

##### 3. زيادة ذاكرة البناء
تم إضافة الإعداد التالي في `vercel.json`:
```json
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

##### 4. تحسين إعدادات Next.js
تم إضافة الإعدادات التالية:
```json
{
  "experimental": {
    "serverComponentsExternalPackages": ["@prisma/client"]
  }
}
```

### خطأ: Database connection failed

#### الحلول:
1. **تأكد من صحة DATABASE_URL**
2. **تأكد من أن قاعدة البيانات متاحة من Vercel**
3. **تحقق من إعدادات SSL**

### خطأ: Build timeout

#### الحلول:
1. **استخدم `.vercelignore` لاستبعاد الملفات غير الضرورية**
2. **قلل من حجم node_modules**
3. **استخدم Build Cache**

## 📊 مراقبة النشر

### 1. مراقبة لوج البناء
- اذهب إلى **Deployments** في Vercel
- انقر على آخر نشر
- راجع **Build Logs** للتفاصيل

### 2. مراقبة الأداء
- استخدم **Analytics** في Vercel
- راقب **Function Logs**
- تحقق من **Edge Network**

## 🛠️ أوامر مفيدة

```bash
# التحقق من جاهزية النشر
npm run vercel:check

# البناء المحسن
npm run build

# تنظيف الكاش
npm run clean:build

# إعادة توليد Prisma Client
npm run prisma:generate

# اختبار البناء محلياً
npm run build:force
```

## 🔍 نصائح إضافية

### 1. تحسين الأداء
- استخدم **Image Optimization** من Next.js
- فعّل **Compression**
- استخدم **CDN** من Vercel

### 2. الأمان
- تأكد من استخدام **HTTPS**
- فعّل **Security Headers**
- استخدم **Environment Variables** للمعلومات الحساسة

### 3. المراقبة
- فعّل **Error Tracking**
- استخدم **Performance Monitoring**
- راقب **Database Connections**

## 📞 الدعم

إذا واجهت مشاكل:
1. راجع **Build Logs** في Vercel
2. شغل `npm run vercel:check` محلياً
3. تحقق من **Environment Variables**
4. راجع **Database Connection**

---

**ملاحظة**: هذا الدليل محدث بتاريخ 2025-01-29 ويتضمن جميع التحسينات الأخيرة للنشر في Vercel. 