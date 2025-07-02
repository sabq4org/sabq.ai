# دليل نشر مشروع sabq-ai-cms على الخادم

## متطلبات الخادم
- Node.js 18+ 
- npm أو yarn
- PM2 (لإدارة العمليات)
- Nginx (كـ reverse proxy)

## خطوات النشر

### 1. نسخ المشروع إلى الخادم
```bash
git clone https://github.com/sabq4org/sabq-ai-cms.git
cd sabq-ai-cms
```

### 2. تثبيت التبعيات
```bash
npm install
```

### 3. إعداد متغيرات البيئة
أنشئ ملف `.env.production.local` في جذر المشروع:

```env
# إعدادات البريد الإلكتروني
SMTP_HOST=mail.jur3a.ai
SMTP_PORT=465
SMTP_USER=noreplay@jur3a.ai
SMTP_PASS=oFWD[H,A8~8;iw7(
SMTP_FROM_EMAIL=noreplay@jur3a.ai
SMTP_FROM_NAME=منصة جُرعة
SMTP_SECURE=true
EMAIL_DEBUG=false

# إعدادات التطبيق
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://jur3a.ai
NEXT_PUBLIC_SITE_NAME=جُرعة
```

### 4. البناء للإنتاج

#### الطريقة المفضلة (باستخدام السكريبت المخصص):
```bash
chmod +x scripts/build-with-email.sh
./scripts/build-with-email.sh
```

#### أو يدوياً:
```bash
source scripts/set-email-env.sh
npm run build
```

### 5. تشغيل التطبيق

#### باستخدام PM2:
```bash
# تثبيت PM2 إذا لم يكن مثبتاً
npm install -g pm2

# تشغيل التطبيق
pm2 start npm --name "sabq-cms" -- start

# حفظ إعدادات PM2
pm2 save
pm2 startup
```

#### أو مباشرة:
```bash
npm start
```

### 6. إعداد Nginx

أنشئ ملف إعدادات Nginx:
```nginx
server {
    listen 80;
    server_name jur3a.ai www.jur3a.ai;
    
    # إعادة توجيه إلى HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name jur3a.ai www.jur3a.ai;
    
    # شهادات SSL
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    # إعدادات SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Proxy إلى Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # الملفات الثابتة
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
    
    # الصور المرفوعة
    location /uploads {
        alias /path/to/sabq-ai-cms/public/uploads;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

### 7. أوامر PM2 المفيدة

```bash
# عرض حالة التطبيق
pm2 status

# عرض السجلات
pm2 logs sabq-cms

# إعادة تشغيل التطبيق
pm2 restart sabq-cms

# إيقاف التطبيق
pm2 stop sabq-cms

# حذف التطبيق من PM2
pm2 delete sabq-cms
```

### 8. الصيانة والتحديثات

لتحديث التطبيق:
```bash
# إيقاف التطبيق
pm2 stop sabq-cms

# سحب التحديثات
git pull origin main

# تثبيت التبعيات الجديدة
npm install

# البناء
./scripts/build-with-email.sh

# إعادة تشغيل التطبيق
pm2 restart sabq-cms
```

## استكشاف الأخطاء

### مشكلة البريد الإلكتروني
إذا ظهرت رسائل خطأ متعلقة بـ Gmail:
1. تأكد من تعيين متغيرات البيئة بشكل صحيح
2. استخدم السكريبت المخصص للبناء: `./scripts/build-with-email.sh`

### مشكلة الصلاحيات
```bash
# إعطاء صلاحيات للمجلدات المطلوبة
chmod -R 755 public/uploads
chown -R www-data:www-data public/uploads
```

### مشكلة المنافذ
تأكد من أن المنفذ 3000 غير مستخدم:
```bash
lsof -i :3000
```

## الأمان

1. **استخدم HTTPS دائماً** في الإنتاج
2. **احم متغيرات البيئة** ولا تشاركها
3. **قم بتحديث التبعيات** بانتظام
4. **راقب السجلات** للكشف عن أي نشاط مشبوه
5. **احتفظ بنسخ احتياطية** من البيانات والإعدادات 