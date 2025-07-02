# دليل نشر المشروع على Vercel

## 📋 المتطلبات

1. حساب على [Vercel](https://vercel.com)
2. حساب على [PlanetScale](https://planetscale.com) أو أي قاعدة بيانات MySQL
3. Repository على GitHub

## 🚀 خطوات النشر

### 1. إعداد قاعدة البيانات PlanetScale

```bash
# إنشاء قاعدة بيانات جديدة
pscale database create sabq-ai-cms

# إنشاء branch رئيسي
pscale branch create sabq-ai-cms main

# الحصول على connection string
pscale connect sabq-ai-cms main
```

### 2. تشغيل Prisma Migrations

```bash
# تحديث DATABASE_URL في .env
DATABASE_URL="mysql://..."

# توليد Prisma Client
npx prisma generate

# دفع المخطط لقاعدة البيانات
npx prisma db push
```

### 3. إعداد Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اضغط على "New Project"
3. استورد Repository من GitHub
4. أضف متغيرات البيئة:

```env
# قاعدة البيانات (إجباري)
DATABASE_URL=mysql://[user]:[password]@[host]/[database]?ssl={"rejectUnauthorized":true}

# إعدادات أساسية
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=[generate-secret]

# تفعيل قاعدة البيانات للتفاعلات
USE_DATABASE=true

# البريد الإلكتروني (اختياري)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=app-password
```

### 4. Build Settings

```json
{
  "buildCommand": "npx prisma generate && npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 5. إعدادات إضافية

#### أ) تفعيل Edge Functions
```json
// vercel.json
{
  "functions": {
    "app/api/interactions/track/route.ts": {
      "runtime": "edge"
    },
    "app/api/user/loyalty-points/[id]/route.ts": {
      "runtime": "edge"
    }
  }
}
```

#### ب) إعداد CORS (إذا لزم)
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" }
      ]
    }
  ]
}
```

## ✅ التحقق من النشر

1. **تحقق من قاعدة البيانات**:
   ```bash
   npx prisma studio
   ```

2. **تحقق من API**:
   ```bash
   curl https://your-app.vercel.app/api/interactions/track \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"userId":"test","articleId":"test","interactionType":"like"}'
   ```

3. **مراقبة السجلات**:
   - اذهب إلى Vercel Dashboard
   - اضغط على "Functions"
   - شاهد السجلات الحية

## 🛠️ حل المشاكل الشائعة

### 1. خطأ في الاتصال بقاعدة البيانات
```
Error: Can't reach database server
```
**الحل**: تأكد من أن SSL مفعل في connection string:
```
?ssl={"rejectUnauthorized":true}
```

### 2. خطأ Prisma Client
```
Error: @prisma/client did not initialize yet
```
**الحل**: أضف `npx prisma generate` لـ build command

### 3. تفاعلات لا تُحفظ
**الحل**: تأكد من أن `USE_DATABASE=true` في متغيرات البيئة

## 📊 المراقبة والصيانة

### مراقبة الأداء
- استخدم Vercel Analytics
- راقب استخدام قاعدة البيانات في PlanetScale Dashboard

### النسخ الاحتياطي
```bash
# نسخ احتياطي يومي
npx prisma db pull
npx prisma migrate diff
```

## 🎯 النصائح

1. **استخدم Vercel Environment Variables** لكل البيئات (Preview, Production)
2. **فعّل Automatic Deployments** من GitHub
3. **استخدم PlanetScale Insights** لمراقبة الاستعلامات البطيئة
4. **احتفظ بنسخة احتياطية** من بيانات المستخدمين

## 🚨 مهم

- **لا تشارك** متغيرات البيئة الحساسة
- **فعّل 2FA** على جميع الحسابات
- **راقب الاستخدام** لتجنب تجاوز الحدود المجانية 