# دليل نشر sabq-ai-cms في بيئة الإنتاج

## المشاكل الحالية وحلولها

### 1. عدم تطابق نوع قاعدة البيانات

**المشكلة**: 
- المشروع يستخدم MySQL محلياً (عبر PlanetScale)
- بيئة الإنتاج تستخدم PostgreSQL
- Prisma Schema الحالي مُعد لـ MySQL فقط

**الحلول**:

#### الحل A: استخدام MySQL في الإنتاج (موصى به)
1. استخدم PlanetScale للإنتاج أيضاً:
   ```bash
   # إنشاء قاعدة بيانات إنتاج في PlanetScale
   pscale database create jur3a-production --region me-south-1
   ```

2. احصل على بيانات الاتصال:
   ```bash
   pscale password create jur3a-production main production-password
   ```

3. حدث `.env.production`:
   ```env
   DATABASE_URL="mysql://[username]:[password]@[host]/jur3a-production?ssl=true"
   ```

#### الحل B: دعم PostgreSQL و MySQL
1. استخدم `prisma/schema-postgres.prisma` للإنتاج
2. أضف في `package.json`:
   ```json
   "scripts": {
     "build:prod": "NODE_ENV=production ./scripts/setup-prisma.sh && next build",
     "prisma:generate:prod": "prisma generate --schema=./prisma/schema-postgres.prisma"
   }
   ```

### 2. مشاكل المصادقة

**المشكلة**: 
- `/api/categories/import` يتطلب تسجيل دخول
- نظام المصادقة غير مكتمل

**الحل المؤقت**:
استخدم API key في headers:
```javascript
fetch('/api/categories/import', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.NEXT_PUBLIC_API_KEY
  },
  body: formData
})
```

## خطوات النشر الكاملة

### 1. إعداد البيئة

```bash
# نسخ ملف البيئة
cp production.env.example .env.production

# تحديث المتغيرات:
DATABASE_URL=mysql://... # أو postgres://...
NEXTAUTH_URL=https://jur3a.ai
NEXTAUTH_SECRET=$(openssl rand -base64 32)
API_SECRET_KEY=$(openssl rand -base64 32)
```

### 2. إعداد قاعدة البيانات

#### لـ MySQL (PlanetScale):
```bash
# الاتصال بقاعدة البيانات
pscale connect jur3a-production main --port 3309

# تطبيق المخطط
npx prisma db push
```

#### لـ PostgreSQL:
```bash
# استخدم schema PostgreSQL
cp prisma/schema-postgres.prisma prisma/schema.prisma

# تطبيق المخطط
npx prisma migrate deploy
```

### 3. البناء والنشر

```bash
# تثبيت التبعيات
npm ci --production

# البناء
npm run build

# البدء
npm start
```

### 4. استخدام Docker (اختياري)

```dockerfile
FROM node:20-alpine

WORKDIR /app

# نسخ الملفات
COPY package*.json ./
COPY prisma ./prisma/

# تثبيت التبعيات
RUN npm ci --production

# توليد Prisma Client
RUN npx prisma generate

# نسخ باقي الملفات
COPY . .

# البناء
RUN npm run build

# البدء
CMD ["npm", "start"]
```

## متغيرات البيئة المطلوبة

```env
# قاعدة البيانات
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=https://jur3a.ai
NEXTAUTH_SECRET=

# API
API_SECRET_KEY=
NEXT_PUBLIC_API_URL=https://jur3a.ai

# اختياري
GOOGLE_ANALYTICS_ID=
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=
```

## التحقق من النشر

1. **صحة قاعدة البيانات**:
   ```bash
   npx prisma db push --skip-generate
   ```

2. **اختبار API**:
   ```bash
   curl https://jur3a.ai/api/articles?limit=1
   ```

3. **اختبار التصنيفات**:
   ```bash
   curl https://jur3a.ai/api/categories
   ```

## استكشاف الأخطاء

### خطأ 500 في API
- تحقق من اتصال قاعدة البيانات
- تحقق من logs: `pm2 logs` أو `docker logs`
- تأكد من تطابق Prisma Schema مع نوع قاعدة البيانات

### خطأ 401 
- تأكد من تسجيل الدخول
- أو استخدم API key في headers

### مشاكل CORS
أضف في `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
      ],
    },
  ]
}
```

## الأمان

1. **لا تكشف معلومات حساسة**:
   - استخدم `.env.production` ولا ترفعه لـ git
   - استخدم secrets management في الإنتاج

2. **حماية API**:
   - فعّل rate limiting
   - استخدم HTTPS دائماً
   - تحقق من الصلاحيات في كل endpoint

3. **نسخ احتياطي**:
   - أعد نسخ احتياطي يومي لقاعدة البيانات
   - احتفظ بالنسخ لمدة 30 يوم على الأقل 