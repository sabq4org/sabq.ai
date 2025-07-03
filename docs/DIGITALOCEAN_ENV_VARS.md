# متغيرات البيئة المطلوبة لـ DigitalOcean App Platform

## المتغيرات السرية (Encrypted Variables)

يجب إضافة هذه المتغيرات كـ "Encrypted" في DigitalOcean:

```bash
# قاعدة البيانات PlanetScale
DATABASE_URL=mysql://[username]:[password]@[host]/[database]?ssl={"rejectUnauthorized":true}

# مفتاح JWT للمصادقة
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# مفتاح Cloudinary السري
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# مفتاح NextAuth
NEXTAUTH_SECRET=your-nextauth-secret-minimum-32-characters

# مفتاح OpenAI (اختياري - إذا كنت تريد استخدام ميزات AI)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

## المتغيرات العامة (Plain Text Variables)

يمكن إضافة هذه المتغيرات كـ "Plain text":

```bash
# بيئة التطبيق
NODE_ENV=production

# Cloudinary (عامة)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dybhezmvb
NEXT_PUBLIC_CLOUDINARY_API_KEY=559894124915114

# منفذ التطبيق
PORT=3000

# إعدادات Prisma
PRISMA_CLI_BINARY_TARGETS=["debian-openssl-3.0.x"]

# رابط التطبيق
NEXTAUTH_URL=https://your-app-name.ondigitalocean.app
```

## متغيرات اختيارية

```bash
# تفعيل تسجيل الأخطاء
NEXT_PUBLIC_DEBUG=false

# حد رفع الملفات (بالميجابايت)
MAX_FILE_SIZE=10

# مدة الجلسة (بالأيام)
SESSION_MAX_AGE=30
```

## كيفية الإضافة في DigitalOcean

1. اذهب إلى App Settings
2. اختر "Environment Variables"
3. اضغط على "Add Variable"
4. أدخل الاسم والقيمة
5. اختر النوع (Encrypted أو Plain text)
6. احفظ التغييرات

## ملاحظات مهمة

- **لا تنسَ** إضافة `ssl={"rejectUnauthorized":true}` في نهاية DATABASE_URL
- **تأكد** من أن JWT_SECRET و NEXTAUTH_SECRET مختلفان وطويلان
- **احذر** من مشاركة المتغيرات السرية في أي مكان
- **قم بتحديث** NEXTAUTH_URL ليطابق رابط تطبيقك الفعلي

## للاختبار المحلي

قم بإنشاء ملف `.env.local` بنفس المتغيرات للتطوير المحلي. 