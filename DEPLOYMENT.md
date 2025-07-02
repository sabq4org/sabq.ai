# دليل نشر صحيفة سبق الذكية

<div dir="rtl">

## 📋 المحتويات

1. [التحضير للنشر](#التحضير-للنشر)
2. [النشر على Vercel](#النشر-على-vercel)
3. [النشر على VPS](#النشر-على-vps)
4. [النشر باستخدام Docker](#النشر-باستخدام-docker)
5. [إعداد قاعدة البيانات](#إعداد-قاعدة-البيانات)
6. [إعداد CDN](#إعداد-cdn)
7. [الأمان والحماية](#الأمان-والحماية)
8. [المراقبة والصيانة](#المراقبة-والصيانة)

## 🚀 التحضير للنشر

### 1. تحديث متغيرات البيئة

أنشئ ملف `.env.production` بالقيم الصحيحة:

```bash
# نسخ ملف المثال
cp .env.example .env.production

# تحديث القيم في .env.production
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.sabq-ai.com
NEXT_PUBLIC_SITE_URL=https://sabq-ai.com
JWT_SECRET=your-production-secret-key
```

### 2. بناء المشروع

```bash
# تثبيت التبعيات
npm install --production

# بناء المشروع
npm run build

# اختبار البناء محلياً
npm run start
```

### 3. فحص الأخطاء

```bash
# فحص TypeScript
npm run type-check

# فحص ESLint
npm run lint

# اختبار الوحدات
npm run test
```

## 🌐 النشر على Vercel

### الطريقة الأولى: عبر GitHub

1. ارفع المشروع على GitHub:
```bash
git add .
git commit -m "إعداد المشروع للنشر"
git push origin main
```

2. اذهب إلى [Vercel](https://vercel.com)
3. اضغط "New Project"
4. اربط حساب GitHub واختر المستودع
5. أضف متغيرات البيئة
6. اضغط "Deploy"

### الطريقة الثانية: عبر CLI

```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel

# اتبع التعليمات
```

## 🖥️ النشر على VPS

### المتطلبات

- Ubuntu 20.04+ أو CentOS 8+
- Node.js 20+
- Nginx
- PM2
- SSL Certificate

### الخطوات

#### 1. إعداد السيرفر

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت PM2
sudo npm install -g pm2

# تثبيت Nginx
sudo apt install nginx -y
```

#### 2. نسخ المشروع

```bash
# إنشاء مجلد للمشروع
sudo mkdir -p /var/www/sabq-ai-cms
sudo chown -R $USER:$USER /var/www/sabq-ai-cms

# نسخ الملفات
cd /var/www/sabq-ai-cms
git clone https://github.com/your-username/sabq-ai-cms.git .

# تثبيت التبعيات
npm install --production

# بناء المشروع
npm run build
```

#### 3. إعداد PM2

أنشئ ملف `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'sabq-ai-cms',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/sabq-ai-cms',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

تشغيل التطبيق:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. إعداد Nginx

أنشئ ملف `/etc/nginx/sites-available/sabq-ai-cms`:

```nginx
server {
    listen 80;
    server_name sabq-ai.com www.sabq-ai.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sabq-ai.com www.sabq-ai.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/sabq-ai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sabq-ai.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Proxy settings
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
    
    # Static files
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Uploads
    location /uploads {
        alias /var/www/sabq-ai-cms/public/uploads;
        add_header Cache-Control "public, max-age=31536000";
    }
}
```

تفعيل الموقع:

```bash
sudo ln -s /etc/nginx/sites-available/sabq-ai-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. إعداد SSL

```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx -y

# الحصول على شهادة SSL
sudo certbot --nginx -d sabq-ai.com -d www.sabq-ai.com
```

## 🐳 النشر باستخدام Docker

### 1. بناء الصورة

```bash
# بناء صورة Docker
docker build -t sabq-ai-cms .

# أو باستخدام docker-compose
docker-compose build
```

### 2. تشغيل الحاوية

```bash
# تشغيل بـ Docker
docker run -d \
  --name sabq-ai-cms \
  -p 3000:3000 \
  -v $(pwd)/public/uploads:/app/public/uploads \
  -v $(pwd)/data:/app/data \
  --env-file .env.production \
  sabq-ai-cms

# أو باستخدام docker-compose
docker-compose up -d
```

### 3. النشر على Docker Hub

```bash
# تسجيل الدخول
docker login

# وضع tag للصورة
docker tag sabq-ai-cms:latest yourusername/sabq-ai-cms:latest

# رفع الصورة
docker push yourusername/sabq-ai-cms:latest
```

## 🗄️ إعداد قاعدة البيانات

### PostgreSQL (موصى به للإنتاج)

```bash
# تثبيت PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# إنشاء قاعدة البيانات والمستخدم
sudo -u postgres psql

CREATE DATABASE sabq_ai_cms;
CREATE USER sabq_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sabq_ai_cms TO sabq_user;
\q

# تحديث .env.production
DATABASE_URL=postgresql://sabq_user:your_password@localhost:5432/sabq_ai_cms
```

## 🌍 إعداد CDN

### Cloudflare

1. أضف موقعك إلى Cloudflare
2. حدث DNS records
3. فعّل الخيارات التالية:
   - Auto Minify (JavaScript, CSS, HTML)
   - Brotli compression
   - Browser Cache TTL: 4 hours
   - Always Online™

### إعدادات Page Rules

```
/*/_next/static/*
Cache Level: Cache Everything
Edge Cache TTL: a month

/uploads/*
Cache Level: Cache Everything
Edge Cache TTL: a month

/api/*
Cache Level: Bypass
```

## 🔒 الأمان والحماية

### 1. تأمين متغيرات البيئة

```bash
# تشفير الملفات الحساسة
openssl enc -aes-256-cbc -salt -in .env.production -out .env.production.enc

# فك التشفير
openssl enc -aes-256-cbc -d -in .env.production.enc -out .env.production
```

### 2. إعداد Firewall

```bash
# UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. تأمين Nginx

أضف إلى ملف Nginx:

```nginx
# تحديد معدل الطلبات
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;

server {
    # ... existing config ...
    
    location /api/ {
        limit_req zone=one burst=20 nodelay;
        # ... proxy settings ...
    }
}
```

## 📊 المراقبة والصيانة

### 1. مراقبة PM2

```bash
# عرض حالة التطبيقات
pm2 status

# عرض السجلات
pm2 logs sabq-ai-cms

# مراقبة الأداء
pm2 monit
```

### 2. إعداد المراقبة

```bash
# تثبيت PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
```

### 3. النسخ الاحتياطي

أنشئ سكريبت `/home/user/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# نسخ قاعدة البيانات
pg_dump sabq_ai_cms > $BACKUP_DIR/db_$DATE.sql

# نسخ الملفات
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/sabq-ai-cms/public/uploads /var/www/sabq-ai-cms/data

# حذف النسخ القديمة (أكثر من 7 أيام)
find $BACKUP_DIR -type f -mtime +7 -delete
```

إضافة إلى crontab:

```bash
# تشغيل النسخ الاحتياطي يومياً في الساعة 2 صباحاً
0 2 * * * /home/user/backup.sh
```

## 🚨 استكشاف الأخطاء

### مشكلة: التطبيق لا يعمل

```bash
# فحص السجلات
pm2 logs
journalctl -u nginx

# إعادة تشغيل الخدمات
pm2 restart all
sudo systemctl restart nginx
```

### مشكلة: أخطاء في البناء

```bash
# مسح ذاكرة التخزين المؤقت
rm -rf .next node_modules
npm install
npm run build
```

### مشكلة: مشاكل في الأداء

```bash
# تحليل حجم الحزمة
npm run analyze

# تفعيل التخزين المؤقت في Redis
# تحديث .env.production
REDIS_URL=redis://localhost:6379
```

## 📞 الدعم

للمساعدة في النشر:
- 📧 Email: deploy@sabq-ai.com
- 💬 Discord: [قناة الدعم الفني](https://discord.gg/sabq-ai-deploy)

</div> 