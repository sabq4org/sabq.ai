# 🔧 دليل حل مشاكل رفع الصور

## المشكلة: رفع الصور لا يعمل في بيئة الإنتاج

### 🔍 خطوات التشخيص

## 1️⃣ اختبار رفع الصور

قم بزيارة صفحة الاختبار:
```
https://jur3a.ai/test-upload
```

هذه الصفحة ستساعدك في:
- التحقق من أن API الرفع يعمل
- عرض رسائل الخطأ التفصيلية
- معاينة الصور المرفوعة

## 2️⃣ فحص مجلدات الرفع

قم بتشغيل سكريبت إصلاح الأذونات:
```bash
node scripts/fix-upload-permissions.js
```

أو يدوياً على السيرفر:
```bash
# إنشاء المجلدات
mkdir -p public/uploads/{avatars,featured,articles}

# تعيين الأذونات
chmod -R 755 public/uploads

# التحقق من الملكية
chown -R www-data:www-data public/uploads  # أو المستخدم المناسب
```

## 3️⃣ فحص إعدادات Next.js

تأكد من أن `next.config.ts` يحتوي على:
```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jur3a.ai',
        port: '',
        pathname: '/**',
      },
      // إضافة أي نطاقات أخرى تحتاجها
    ],
  },
};
```

## 4️⃣ فحص API الرفع

### في المتصفح (DevTools):
1. افتح Console
2. جرب رفع صورة
3. راقب الأخطاء

### فحص Network:
1. افتح Network tab
2. ابحث عن طلب `/api/upload`
3. تحقق من:
   - Status Code
   - Response Body
   - Request Headers

## 5️⃣ مشاكل شائعة وحلولها

### ❌ خطأ 413 (Request Entity Too Large)
**السبب**: حجم الملف أكبر من المسموح في nginx/apache

**الحل**:
```nginx
# في nginx.conf
client_max_body_size 10M;
```

### ❌ خطأ 403 (Forbidden)
**السبب**: مشكلة في الأذونات

**الحل**:
```bash
chmod -R 755 public/uploads
```

### ❌ خطأ 500 (Internal Server Error)
**السبب**: مشكلة في كتابة الملفات

**الحل**:
1. تحقق من مساحة القرص: `df -h`
2. تحقق من أذونات المجلد
3. راجع سجلات Node.js

### ❌ لا يفتح مربع حوار اختيار الملف
**السبب**: مشكلة JavaScript في المتصفح

**الحل**:
1. تحقق من Console للأخطاء
2. تأكد من أن JavaScript مُفعّل
3. جرب متصفح آخر

## 6️⃣ إعدادات بيئة الإنتاج

### في ملف `.env.production`:
```env
# إعدادات الرفع
UPLOAD_MAX_SIZE=5242880  # 5MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml

# مسار الرفع (اختياري)
UPLOAD_DIR=/var/www/uploads
```

### في PM2 ecosystem:
```javascript
module.exports = {
  apps: [{
    name: 'sabq-ai-cms',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log'
  }]
}
```

## 7️⃣ بدائل للتخزين المحلي

### استخدام Cloudinary:
```javascript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (file: File) => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'sabq-cms' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url);
      }
    ).end(buffer);
  });
};
```

### استخدام AWS S3:
```javascript
// lib/s3.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export const uploadToS3 = async (file: File) => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `uploads/${Date.now()}-${file.name}`,
    Body: buffer,
    ContentType: file.type
  });
  
  await s3.send(command);
  return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
};
```

## 8️⃣ سجلات للمراقبة

أضف هذه السجلات في `/api/upload/route.ts`:
```typescript
console.log('📊 Upload Stats:', {
  timestamp: new Date().toISOString(),
  fileSize: file.size,
  fileType: file.type,
  uploadType: type,
  userAgent: request.headers.get('user-agent'),
  ip: request.headers.get('x-forwarded-for') || 'unknown'
});
```

## 9️⃣ أوامر مفيدة للتشخيص

```bash
# فحص المساحة المتاحة
df -h

# فحص أذونات المجلدات
ls -la public/uploads/

# مراقبة السجلات
tail -f logs/out.log

# فحص العمليات
ps aux | grep node

# فحص استخدام الذاكرة
free -m

# فحص منافذ الشبكة
netstat -tlnp | grep 3000
```

## 📞 الدعم

إذا استمرت المشكلة بعد تجربة جميع الحلول:
1. احفظ سجلات الأخطاء من Console
2. احفظ لقطة شاشة من Network tab
3. شارك النتائج من صفحة `/test-upload`
4. راجع ملف `logs/err.log` على السيرفر 