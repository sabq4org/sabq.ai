# إعداد DigitalOcean App Platform

## المشكلة الحالية
الموقع على DigitalOcean يظهر خطأ 503 URX، مما يعني أن التطبيق لا يعمل بسبب مشاكل في الإعدادات.

## الحل المطلوب

### 1. إعداد متغيرات البيئة في DigitalOcean App Platform

اذهب إلى Settings > Environment Variables وأضف:

```
DATABASE_URL=mysql://c9vxzegycj1f11phmk62:[PASSWORD]@aws.connect.psdb.cloud/j3uar_sabq_ai?sslaccept=strict
```

**استبدل [PASSWORD] بكلمة المرور الحقيقية من PlanetScale**

### 2. متغيرات أخرى مطلوبة:

```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXTAUTH_URL=https://jellyfish-app-h2p66.ondigitalocean.app
JWT_SECRET=your-jwt-secret-here
NEXTAUTH_SECRET=your-nextauth-secret-here
```

### 3. إعدادات البناء

- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **Node Version**: 20.x
- **Source Branch**: `main`

## خطوات الإصلاح

1. **افتح DigitalOcean App Platform Dashboard**
2. **اذهب إلى Settings > Environment Variables**
3. **أضف المتغيرات المذكورة أعلاه**
4. **احفظ التغييرات**
5. **انتظر إعادة النشر التلقائي**

## التحقق من النجاح

بعد إعادة النشر، اختبر:
- `https://jellyfish-app-h2p66.ondigitalocean.app/api/health`
- `https://jellyfish-app-h2p66.ondigitalocean.app/api/articles`
- `https://jellyfish-app-h2p66.ondigitalocean.app/api/categories`

## ملاحظات مهمة

1. **DATABASE_URL يجب أن يكون في سطر واحد** - لا تقطعه
2. **كلمة المرور الحقيقية موجودة في ملف .env المحلي**
3. **تأكد من استخدام فرع `main` للنشر**
4. **راجع Build Logs في حالة فشل البناء**

## استكشاف الأخطاء

- **503 URX**: مشكلة في متغيرات البيئة أو فشل البناء
- **404**: التطبيق يعمل لكن الـ routes غير صحيحة
- **500**: خطأ في قاعدة البيانات أو الكود 