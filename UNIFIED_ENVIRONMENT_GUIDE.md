# 🔧 دليل توحيد البيئة - منصة سبق الذكية

## 📋 نظرة عامة
هذا الدليل يوضح كيفية توحيد البيئة بين التطوير المحلي (localhost) والإنتاج (Vercel) لضمان عمل المشروع بشكل سلس.

## 🗂️ هيكل الملفات

### 1. ملف البيئة المحلي `.env.local`
```bash
# قاعدة البيانات (PlanetScale)
DATABASE_URL="mysql://[YOUR_DATABASE_CONNECTION_STRING]"

# تكوين الموقع
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="صحيفة سبق الإلكترونية"

# المصادقة
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# التخزين السحابي
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# البريد الإلكتروني
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# ميزات النظام
ENABLE_AI_FEATURES=true
ENABLE_EMAIL_VERIFICATION=false
DEBUG_MODE=true
```

### 2. إعدادات Vercel
في لوحة تحكم Vercel، أضف نفس المتغيرات مع هذه التعديلات:
```bash
# تعديل URLs للإنتاج
NEXT_PUBLIC_API_URL=https://sabq-ai-cms.vercel.app
NEXT_PUBLIC_SITE_URL=https://sabq-ai-cms.vercel.app
NEXTAUTH_URL=https://sabq-ai-cms.vercel.app

# تعطيل وضع التصحيح
DEBUG_MODE=false
```

## 🔄 إدارة Prisma

### package.json
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:studio": "prisma studio"
  },
  "prisma": {
    "schema": "prisma/schema.prisma"
  }
}
```

### prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../lib/generated/prisma"
  engineType = "library"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

## 🚦 منطق API Routes

### مثال: app/api/articles/route.ts
```typescript
import { getEnvironmentConfig } from '@/lib/debug';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const config = getEnvironmentConfig();
  
  try {
    // منطق موحد يعمل في جميع البيئات
    const articles = await prisma.article.findMany({
      include: {
        author: true,
        category: true
      }
    });
    
    return Response.json({ 
      success: true, 
      data: articles,
      environment: config.isProduction ? 'production' : 'development'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      success: false, 
      error: config.debug ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
```

## 🛠️ أدوات التطوير

### lib/debug.ts
يوفر وظائف مساعدة لإدارة البيئة:
- `logEnvironment()`: عرض معلومات البيئة
- `logDatabaseConnection()`: تسجيل حالة الاتصال
- `isProduction()`: التحقق من بيئة الإنتاج
- `isDevelopment()`: التحقق من بيئة التطوير
- `getEnvironmentConfig()`: الحصول على تكوين البيئة

## 📝 خطوات النشر

### 1. التطوير المحلي
```bash
# إنشاء ملف البيئة
cp env.example .env.local

# تحديث قيم المتغيرات في .env.local

# تثبيت المكتبات
npm install

# توليد Prisma Client
npm run prisma:generate

# تشغيل التطبيق
npm run dev
```

### 2. النشر على Vercel
```bash
# التأكد من Git
git add .
git commit -m "توحيد البيئة"
git push origin main

# Vercel سيقوم تلقائياً بـ:
# 1. قراءة المتغيرات من لوحة التحكم
# 2. تشغيل npm run build
# 3. نشر التطبيق
```

## 🔍 استكشاف الأخطاء

### مشكلة: DATABASE_URL غير موجود
```bash
# تحقق من وجود الملف
ls -la .env.local

# تحقق من المتغير
echo $DATABASE_URL
```

### مشكلة: Prisma Client غير موجود
```bash
# أعد توليد Prisma Client
rm -rf lib/generated/prisma
npm run prisma:generate
```

### مشكلة: أخطاء في Vercel
1. تحقق من Environment Variables في Vercel Dashboard
2. تحقق من Build Logs
3. تأكد من أن DATABASE_URL صحيح ويعمل

## 🌿 استخدام Git Branches

### للتطوير
```bash
git checkout -b dev
# اعمل على التغييرات
git add .
git commit -m "ميزة جديدة"
git push origin dev
```

### للإنتاج
```bash
git checkout main
git merge dev
git push origin main
# Vercel سينشر تلقائياً
```

## ✅ قائمة التحقق النهائية

- [ ] `.env.local` موجود ومحدث
- [ ] جميع المتغيرات مضافة في Vercel
- [ ] `prisma generate` يعمل بدون أخطاء
- [ ] التطبيق يعمل محلياً
- [ ] Git repository نظيف
- [ ] Vercel build ناجح

## 📞 المساعدة

في حالة وجود مشاكل:
1. تحقق من `lib/debug.ts` لعرض معلومات البيئة
2. راجع Vercel Build Logs
3. تأكد من صحة DATABASE_URL
4. تحقق من أن جميع المتغيرات موجودة في البيئتين 