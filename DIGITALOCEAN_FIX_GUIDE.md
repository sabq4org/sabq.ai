# 🚀 دليل إصلاح مشاكل DigitalOcean

## 🔍 المشاكل المكتشفة

### 1. خطأ 503 URX
```
via_upstream (503 URX)
App Platform failed to forward this request to the application.
```

### 2. أخطاء CSS
```
SyntaxError: Invalid character: '@'
```

### 3. أخطاء API
- خطأ 401 في `/api/auth/me`
- خطأ 500 في `/api/auth/login`

## 🛠️ الحلول المطلوبة

### 1. إعدادات متغيرات البيئة على DigitalOcean

يجب التأكد من وجود المتغيرات التالية في لوحة تحكم DigitalOcean:

```bash
# قاعدة البيانات
DATABASE_URL="mysql://username:password@host:port/database_name"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# البيئة
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://jellyfish-app-h2p66.ondigitalocean.app"

# Cloudinary (إختياري)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# إعدادات Prisma للإنتاج
PRISMA_CLIENT_ENGINE_TYPE="library"
```

### 2. إعدادات البناء

تأكد من أن DigitalOcean يستخدم الإعدادات التالية:

```yaml
# Build Settings
Build Command: npm run build
Run Command: npm start
Node Version: 18.x أو أحدث
```

### 3. إعدادات قاعدة البيانات

#### خيار أ: استخدام PlanetScale (مُوصى به)
```bash
DATABASE_URL="mysql://username:password@aws.connect.psdb.cloud/database-name?sslaccept=strict"
```

#### خيار ب: استخدام قاعدة بيانات DigitalOcean
1. إنشاء Managed Database في DigitalOcean
2. الحصول على connection string
3. إضافته كمتغير بيئة

### 4. إصلاح مشاكل CSS

إذا استمر خطأ CSS، تحقق من:

1. **ملف globals.css:** تأكد من عدم وجود أحرف خاصة
2. **استيراد الخطوط:** تأكد من صحة روابط Google Fonts
3. **Tailwind CSS:** تأكد من تكوين Tailwind بشكل صحيح

### 5. إعدادات Dockerfile (إذا كان مطلوب)

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

## 🔧 خطوات الإصلاح

### الخطوة 1: تحديث متغيرات البيئة
1. اذهب إلى DigitalOcean App Platform
2. اختر التطبيق `sabq-ai-cms`
3. اذهب إلى Settings → Environment Variables
4. أضف/حدث المتغيرات المطلوبة

### الخطوة 2: إعادة النشر
1. اذهب إلى Deployments
2. اضغط على "Create Deployment"
3. أو انتظر النشر التلقائي بعد push

### الخطوة 3: فحص السجلات
1. اذهب إلى Runtime Logs
2. ابحث عن أخطاء في:
   - Database connection
   - Missing environment variables
   - Build errors

### الخطوة 4: اختبار API
```bash
# اختبار الصحة العامة
curl https://jellyfish-app-h2p66.ondigitalocean.app/api/health

# اختبار تسجيل الدخول
curl -X POST https://jellyfish-app-h2p66.ondigitalocean.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sabq.org","password":"admin123456"}'
```

## 🎯 بيانات الدخول للاختبار

بعد إصلاح المشاكل، استخدم البيانات التالية:

- **الرابط:** https://jellyfish-app-h2p66.ondigitalocean.app/login
- **البريد الإلكتروني:** admin@sabq.org
- **كلمة المرور:** admin123456

## 📞 الدعم

إذا استمرت المشاكل:

1. **فحص السجلات:** راجع Runtime Logs في DigitalOcean
2. **اختبار محلي:** تأكد من عمل التطبيق محلياً
3. **قاعدة البيانات:** تأكد من صحة اتصال قاعدة البيانات
4. **المتغيرات:** تحقق من جميع متغيرات البيئة

## 🚀 تحسينات إضافية

### تحسين الأداء
- تفعيل CDN في DigitalOcean
- تحسين صور المحتوى
- ضغط الملفات الثابتة

### الأمان
- تحديث كلمات المرور الافتراضية
- تفعيل HTTPS
- إعداد CORS بشكل صحيح

### المراقبة
- إعداد تنبيهات للأخطاء
- مراقبة استخدام الموارد
- نسخ احتياطية دورية لقاعدة البيانات 