# حل سريع - مشكلة عدم ظهور البيانات على DigitalOcean

## المشكلة الأساسية
التطبيق يعمل محلياً لكن لا يعرض البيانات على السيرفر البعيد رغم أن قاعدة البيانات نفسها.

## الحل في 3 خطوات

### 1. تحديث Build Command في DigitalOcean
في **App Platform > Settings > App Spec**، غيّر Build Command إلى:
```bash
npm install && npx prisma generate && npm run build
```

### 2. إضافة/تحديث متغيرات البيئة
في **App Platform > Settings > App-Level Environment Variables**:

```env
# استخدم private- للاتصال الداخلي
DATABASE_URL=postgresql://doadmin:YOUR_PASSWORD_HERE@private-db-sabq-ai-1755-do-user-23559731-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require

DIRECT_URL=postgresql://doadmin:YOUR_PASSWORD_HERE@private-db-sabq-ai-1755-do-user-23559731-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require

# URLs التطبيق
NEXT_PUBLIC_SITE_URL=https://sabq-ai-cms-tdhxn.ondigitalocean.app
NEXT_PUBLIC_API_URL=https://sabq-ai-cms-tdhxn.ondigitalocean.app/api

# بيئة الإنتاج
NODE_ENV=production

# حماية قاعدة البيانات
ENABLE_DB_PROTECTION=true
```

### 3. إضافة binaryTargets في Prisma
في ملف `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../lib/generated/prisma"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

## النشر
```bash
git add .
git commit -m "Fix DigitalOcean deployment - add binary targets and update env"
git push origin main
```

## التحقق من النجاح
1. انتظر حتى ينتهي البناء في DigitalOcean
2. افتح: https://sabq-ai-cms-tdhxn.ondigitalocean.app
3. تحقق من Console في المتصفح للأخطاء

## نصائح مهمة
- **لا تنسى** استخدام `private-` في DATABASE_URL للاتصال الداخلي
- **تأكد** من أن Build Command يحتوي على `npx prisma generate`
- **راقب** Build Logs في DigitalOcean للتأكد من نجاح توليد Prisma Client 