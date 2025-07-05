# متغيرات البيئة المطلوبة في DigitalOcean App Platform

## 🔴 متغيرات أساسية (مطلوبة):

### 1. DATABASE_URL ⭐ (الأهم - يجب تحديثه)
```
postgresql://doadmin:[YOUR_PASSWORD]@private-db-sabq-ai-1755-do-user-23559731-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```
**ملاحظة**: استخدم `private-` للاتصال الداخلي

### 2. NEXT_PUBLIC_SITE_URL
```
https://sabq-ai-cms-ckg9d.ondigitalocean.app
```
أو الدومين الخاص بك إذا كان لديك

### 3. NEXT_PUBLIC_API_URL
```
https://sabq-ai-cms-ckg9d.ondigitalocean.app/api
```

## 🟡 متغيرات Cloudinary (للصور):

### 4. CLOUDINARY_CLOUD_NAME
```
dybhezmvb
```

### 5. CLOUDINARY_API_KEY
```
559894124915114
```

### 6. CLOUDINARY_API_SECRET
```
(احصل عليه من لوحة تحكم Cloudinary)
```

### 7. NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```
dybhezmvb
```

### 8. NEXT_PUBLIC_CLOUDINARY_API_KEY
```
559894124915114
```

## 🟢 متغيرات البريد الإلكتروني (اختيارية):

### 9. SMTP_HOST
```
mail.jur3a.ai
```

### 10. SMTP_PORT
```
465
```

### 11. SMTP_USER
```
noreplay@jur3a.ai
```

### 12. SMTP_PASS
```
(كلمة المرور الخاصة بك)
```

### 13. SMTP_SECURE
```
true
```

### 14. EMAIL_FROM_NAME
```
سبق
```

### 15. EMAIL_FROM_ADDRESS
```
noreply@sabq.org
```

## 🔵 متغيرات إضافية (اختيارية):

### 16. OPENAI_API_KEY
```
(إذا كنت تستخدم AI لتصنيف التعليقات)
```

### 17. API_SECRET_KEY
```
X9yZ1aC3eF5gH7jK9mN2pQ4rS6tV8wX0yZ1aC3eF5gH7j
```

### 18. NODE_ENV
```
production
```

### 19. ENABLE_DB_PROTECTION
```
true
```

### 20. SKIP_EMAIL_VERIFICATION
```
false
```

## 📋 كيفية إضافتها في DigitalOcean:

1. اذهب إلى [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. افتح تطبيقك
3. اذهب إلى **Settings** > **App-Level Environment Variables**
4. اضغط **Edit**
5. أضف المتغيرات واحداً تلو الآخر
6. اضغط **Save**
7. سيتم إعادة نشر التطبيق تلقائياً

## ⚠️ ملاحظات مهمة:

1. **DATABASE_URL** هو الأهم ويجب تحديثه للإشارة إلى PostgreSQL الجديد
2. استخدم `private-` في DATABASE_URL للاتصال الداخلي الأسرع
3. تأكد من إضافة التطبيق في Trusted Sources لقاعدة البيانات
4. المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` ستكون متاحة في الواجهة الأمامية 