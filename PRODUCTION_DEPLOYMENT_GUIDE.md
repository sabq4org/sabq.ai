# دليل نشر المشروع على خادم الإنتاج 🚀

## ✅ حالة المشروع: جاهز للنشر
- **آخر بناء ناجح**: ✅ Build Successful
- **جميع الأخطاء محلولة**: ✅
- **مرفوع على GitHub**: ✅

## 📋 متطلبات الخادم
- Node.js 18+ 
- PM2 لإدارة العمليات
- Apache/Nginx للـ Reverse Proxy
- SSL Certificate
- Git

## 🚀 خطوات النشر

### 1. الاتصال بالخادم
```bash
ssh root@jur3a.ai
```

### 2. استنساخ المشروع
```bash
cd /var/www
git clone https://github.com/sabq4org/sabq-ai-cms.git jur3a.ai
cd jur3a.ai
```

### 3. إعداد متغيرات البيئة
```bash
cp .env.example .env.production
nano .env.production
```

تأكد من تعيين:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://jur3a.ai
DATABASE_URL=your_production_database_url
JWT_SECRET=your_secure_jwt_secret
EMAIL_HOST=mail.jur3a.ai
EMAIL_PORT=587
EMAIL_USER=noreplay@jur3a.ai
EMAIL_PASS=your_email_password
```

### 4. تثبيت التبعيات
```bash
npm install --production
```

### 5. بناء المشروع
```bash
npm run build
```

### 6. إعداد PM2
```bash
# تثبيت PM2 إذا لم يكن مثبتاً
npm install -g pm2

# بدء التطبيق
pm2 start ecosystem.config.js --env production

# حفظ إعدادات PM2
pm2 save
pm2 startup
```

### 7. إعداد Apache

إنشاء ملف التكوين:
```bash
nano /etc/apache2/sites-available/jur3a.ai.conf
```

محتوى الملف:
```apache
<VirtualHost *:80>
    ServerName jur3a.ai
    ServerAlias www.jur3a.ai
    
    # إعادة توجيه HTTP إلى HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName jur3a.ai
    ServerAlias www.jur3a.ai
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/ssl/cert.pem
    SSLCertificateKeyFile /path/to/ssl/key.pem
    SSLCertificateChainFile /path/to/ssl/chain.pem
    
    # Headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    
    # Proxy Configuration
    ProxyRequests Off
    ProxyPreserveHost On
    
    # WebSocket Support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:3000/$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*)           http://localhost:3000/$1 [P,L]
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Error handling
    ErrorDocument 503 /maintenance.html
</VirtualHost>
```

تفعيل الموقع:
```bash
a2ensite jur3a.ai.conf
a2enmod proxy proxy_http proxy_wstunnel rewrite headers ssl
systemctl reload apache2
```

### 8. إعداد جدار الحماية
```bash
# السماح بـ HTTP و HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

## 🔍 التحقق من النشر

### 1. فحص حالة PM2
```bash
pm2 status
pm2 logs
```

### 2. فحص Apache
```bash
systemctl status apache2
tail -f /var/log/apache2/error.log
```

### 3. اختبار الموقع
- افتح https://jur3a.ai
- تحقق من عمل الصفحة الرئيسية
- جرب تسجيل الدخول
- تحقق من لوحة التحكم

## 🛠️ الصيانة والتحديثات

### تحديث الكود
```bash
cd /var/www/jur3a.ai
git pull origin main
npm install --production
npm run build
pm2 restart all
```

### مراقبة الأداء
```bash
# عرض استخدام الموارد
pm2 monit

# عرض السجلات
pm2 logs

# عرض معلومات مفصلة
pm2 show 0
```

### النسخ الاحتياطي
```bash
# نسخ احتياطي للبيانات
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# نسخ احتياطي لقاعدة البيانات
mysqldump -u root -p sabq_ai > backup-$(date +%Y%m%d).sql
```

## 🚨 حل المشاكل الشائعة

### خطأ 503 Service Unavailable
1. تحقق من حالة PM2: `pm2 status`
2. أعد تشغيل التطبيق: `pm2 restart all`
3. تحقق من السجلات: `pm2 logs`

### مشاكل الذاكرة
```bash
# زيادة حد الذاكرة
pm2 start ecosystem.config.js --max-memory-restart 2G
```

### مشاكل الصلاحيات
```bash
# تعيين الصلاحيات الصحيحة
chown -R www-data:www-data /var/www/jur3a.ai
chmod -R 755 /var/www/jur3a.ai
chmod -R 777 /var/www/jur3a.ai/public/uploads
```

## 📞 معلومات الدعم
- **المطور**: علي الحازمي
- **GitHub**: https://github.com/sabq4org/sabq-ai-cms
- **آخر تحديث**: 2025-01-26

## ✅ قائمة التحقق النهائية
- [ ] استنساخ المشروع من GitHub
- [ ] إعداد متغيرات البيئة
- [ ] تثبيت التبعيات
- [ ] بناء المشروع بنجاح
- [ ] تشغيل التطبيق بـ PM2
- [ ] إعداد Apache/Nginx
- [ ] تثبيت شهادة SSL
- [ ] اختبار الموقع
- [ ] إعداد النسخ الاحتياطي الدوري
- [ ] إعداد المراقبة

---

🎉 **مبروك! المشروع جاهز للعمل على خادم الإنتاج** 