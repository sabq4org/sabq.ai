# دليل نشر التطبيق على DigitalOcean

## الإعدادات الحالية
- **Branch**: `main` (تم تحديثه من clean-main)
- **Auto Deploy**: مفعّل - سينشر تلقائياً عند كل push
- **Build Command**: `npm run build:do`
- **Run Command**: `npm start`

## كيفية النشر

### 1. النشر التلقائي (Auto Deploy)
بما أن `deploy_on_push: true` مفعّل، فإن التطبيق سينشر تلقائياً عند:
```bash
git push origin main
```

### 2. النشر اليدوي من لوحة التحكم
1. اذهب إلى: https://cloud.digitalocean.com/apps
2. اختر تطبيقك: `sabq-ai-cms`
3. اضغط على زر **"Deploy"** الأزرق
4. اختر **"Deploy from main branch"**

### 3. Force Rebuild (في حالة المشاكل)
1. اذهب إلى **Settings** > **App Settings**
2. ابحث عن **"Force Rebuild & Deploy"**
3. اضغط على الزر

## التحقق من حالة النشر
1. في لوحة التحكم، اذهب إلى **"Activity"** tab
2. ستجد سجل بجميع عمليات النشر
3. اضغط على أي deployment لرؤية التفاصيل والـ logs

## معلومات مهمة
- **آخر commit**: `5d0f4c7` - تحديث branch النشر إلى main
- **Build Time**: حوالي 10-15 دقيقة
- **Instance**: Professional XS (1 vCPU, 2GB RAM)

## في حالة فشل البناء
1. تحقق من Build Logs في Activity tab
2. تأكد من أن جميع environment variables مضبوطة
3. تحقق من أن `npm run build:do` يعمل محلياً

## Environment Variables المطلوبة
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - للمصادقة
- `NEXTAUTH_SECRET` - لـ NextAuth
- `CLOUDINARY_API_SECRET` - لرفع الصور

---
تم التحديث: 2024-07-06 