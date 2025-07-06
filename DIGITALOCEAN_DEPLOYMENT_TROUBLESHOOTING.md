# دليل حل مشاكل النشر على DigitalOcean

## المشكلة
- التطبيق يعمل محلياً ويعرض التصنيفات والمقالات
- على السيرفر البعيد (DigitalOcean) لا تظهر أي بيانات
- قاعدة البيانات نفسها (PostgreSQL على DigitalOcean)

## الأسباب المحتملة والحلول

### 1. متغيرات البيئة غير صحيحة
**المشكلة**: DATABASE_URL يستخدم العنوان العام محلياً والخاص على السيرفر

**الحل**:
```bash
# محلياً (من خارج DigitalOcean)
DATABASE_URL="postgresql://doadmin:AVNS_xxx@db-sabq-ai-1755-do-user-23559731-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

# على السيرفر (داخل DigitalOcean)
DATABASE_URL="postgresql://doadmin:AVNS_xxx@private-db-sabq-ai-1755-do-user-23559731-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

### 2. عدم بناء التطبيق بشكل صحيح
**المشكلة**: Prisma Client لم يتم توليده في بيئة الإنتاج

**الحل في package.json**:
```json
"scripts": {
  "build": "prisma generate && next build",
  "postinstall": "prisma generate"
}
```

### 3. مشكلة في SSL/TLS
**المشكلة**: قاعدة البيانات تتطلب SSL لكن الإعدادات غير صحيحة

**الحل**:
```bash
# جرب تعطيل التحقق من SSL مؤقتاً
DATABASE_URL="postgresql://...?sslmode=disable"

# أو استخدم
DATABASE_URL="postgresql://...?sslmode=no-verify"
```

### 4. مشكلة في Trusted Sources
**المشكلة**: عنوان IP للسيرفر غير مضاف في Trusted Sources

**الحل**:
1. احصل على IP السيرفر من DigitalOcean App Platform
2. أضفه في قاعدة البيانات Trusted Sources

### 5. مشكلة في البناء والنشر
**التحقق من logs في DigitalOcean**:
```bash
# في App Platform
# اذهب إلى Runtime Logs
# ابحث عن أخطاء مثل:
# - PrismaClientInitializationError
# - Connection refused
# - ECONNREFUSED
```

## خطوات التشخيص

### 1. تحقق من متغيرات البيئة في DigitalOcean
```bash
# في App Platform > Settings > App-Level Environment Variables
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_API_URL
```

### 2. تحقق من Build Command
```bash
# يجب أن يكون:
npm install && npm run build

# أو
npm install && npx prisma generate && npm run build
```

### 3. تحقق من Run Command
```bash
# يجب أن يكون:
npm start

# أو
node_modules/.bin/next start
```

### 4. إضافة متغيرات البيئة الضرورية
```env
# قاعدة البيانات (استخدم private- للاتصال الداخلي)
DATABASE_URL="postgresql://doadmin:AVNS_xxx@private-db-sabq-ai-1755-do-user-23559731-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
DIRECT_URL="${DATABASE_URL}"

# URLs
NEXT_PUBLIC_SITE_URL="https://your-app.ondigitalocean.app"
NEXT_PUBLIC_API_URL="https://your-app.ondigitalocean.app/api"

# بيئة الإنتاج
NODE_ENV="production"

# حماية قاعدة البيانات
ENABLE_DB_PROTECTION="true"
```

### 5. تحقق من Prisma Schema
في `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../lib/generated/prisma"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

## الحل السريع

### 1. في DigitalOcean App Platform
1. اذهب إلى **Settings** > **App-Level Environment Variables**
2. تأكد من وجود:
   - `DATABASE_URL` مع `private-` prefix
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_SITE_URL` و `NEXT_PUBLIC_API_URL`

### 2. في Build Command
```bash
npm install && npx prisma generate && npm run build
```

### 3. أعد النشر
```bash
git add .
git commit -m "Fix deployment configuration"
git push origin main
```

## نصائح إضافية

### 1. استخدم App Platform Logs
- Build Logs: للتحقق من أخطاء البناء
- Runtime Logs: للتحقق من أخطاء التشغيل
- Deploy Logs: للتحقق من عملية النشر

### 2. اختبر الاتصال
أضف endpoint للاختبار:
```typescript
// app/api/test-db/route.ts
export async function GET() {
  try {
    const count = await prisma.user.count();
    return Response.json({ 
      success: true, 
      userCount: count,
      env: process.env.NODE_ENV,
      dbUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set'
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

### 3. تحقق من Console
افتح Console في المتصفح وابحث عن:
- أخطاء 500
- أخطاء CORS
- أخطاء في جلب البيانات 