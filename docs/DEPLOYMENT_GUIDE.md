# 🚀 دليل التشغيل والنشر - مشروع سبق الذكي

## 📋 نظرة عامة

هذا الدليل يوضح كيفية تشغيل مشروع سبق الذكي بالكامل، بما في ذلك جميع الخدمات والمكونات المطلوبة.

## 🎯 المتطلبات الأساسية

### 📦 البرمجيات المطلوبة
- **Node.js** 18.0.0 أو أحدث
- **npm** 9.0.0 أو أحدث
- **Python** 3.9.0 أو أحدث
- **pip** 21.0.0 أو أحدث
- **PostgreSQL** 14.0 أو أحدث (أو Supabase)
- **Redis** 6.0 أو أحدث (اختياري)

### 🔧 التحقق من المتطلبات
```bash
# التحقق من Node.js
node --version

# التحقق من npm
npm --version

# التحقق من Python
python3 --version

# التحقق من pip
pip3 --version
```

## 🚀 التشغيل السريع

### 1. **استنساخ المشروع**
```bash
git clone https://github.com/sabq4org/sabq-ai.git
cd sabq-ai
```

### 2. **تشغيل السكريبت الشامل**
```bash
# تشغيل جميع الخدمات
./scripts/start-all.sh
```

هذا السكريبت سيقوم بـ:
- ✅ التحقق من المتطلبات
- ✅ إعداد قاعدة البيانات
- ✅ تشغيل خدمة الذكاء الاصطناعي
- ✅ تشغيل الواجهة الخلفية
- ✅ اختبار جميع APIs
- ✅ عرض معلومات الخدمات

## 🔧 التشغيل اليدوي

### 1. **إعداد البيئة**
```bash
# نسخ متغيرات البيئة
cp .env.example .env

# تعديل المتغيرات حسب الحاجة
nano .env
```

### 2. **تثبيت التبعيات**
```bash
# تثبيت تبعيات Node.js
npm install

# تثبيت تبعيات Python
cd ml-services
pip3 install -r requirements.txt
cd ..
```

### 3. **إعداد قاعدة البيانات**
```bash
# تشغيل Prisma migration
npx prisma generate
npx prisma db push

# إدراج البيانات الأولية (اختياري)
npx prisma db seed
```

### 4. **تشغيل الخدمات**

#### أ. خدمة الذكاء الاصطناعي
```bash
# في terminal منفصل
cd ml-services
python3 -m uvicorn nlp.app:app --reload --host 0.0.0.0 --port 8000
```

#### ب. الواجهة الخلفية والأمامية
```bash
# في terminal منفصل
npm run dev
```

## 🧪 اختبار النظام

### **اختبار شامل تلقائي**
```bash
# تشغيل جميع الاختبارات
./scripts/test-system.sh
```

### **اختبار يدوي**
```bash
# اختبار الواجهة الأمامية
curl http://localhost:3000

# اختبار API المقالات
curl http://localhost:3000/api/articles

# اختبار خدمة الذكاء الاصطناعي
curl http://localhost:8000/health

# اختبار API التحليلات
curl -X POST http://localhost:3000/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"event_type": "page_view", "event_data": {"page": "test"}}'
```

## 📊 مراقبة الخدمات

### **عناوين الخدمات**
- 🌐 **الواجهة الأمامية**: http://localhost:3000
- 🔧 **APIs الخلفية**: http://localhost:3000/api
- 🤖 **خدمة الذكاء الاصطناعي**: http://localhost:8000
- 📊 **وثائق ML API**: http://localhost:8000/docs

### **لوحات التحكم**
- 📋 **الصفحة الرئيسية**: http://localhost:3000
- 📊 **لوحة التحليلات**: http://localhost:3000/dashboard/analytics
- 💬 **لوحة التغذية الراجعة**: http://localhost:3000/dashboard/feedback

### **مراقبة الأداء**
```bash
# مراقبة استخدام الموارد
top -p $(pgrep -f "node|python")

# مراقبة السجلات
tail -f logs/app.log
```

## 🐛 استكشاف الأخطاء

### **مشاكل شائعة وحلولها**

#### 1. **خطأ اتصال قاعدة البيانات**
```bash
# التحقق من اتصال قاعدة البيانات
npx prisma db pull

# إعادة تشغيل Migration
npx prisma migrate reset
```

#### 2. **خطأ في خدمة الذكاء الاصطناعي**
```bash
# التحقق من Python وتبعياته
python3 --version
pip3 list

# إعادة تثبيت التبعيات
pip3 install -r ml-services/requirements.txt --force-reinstall
```

#### 3. **خطأ في CORS**
```bash
# إضافة CORS_ORIGINS في .env
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
```

#### 4. **خطأ في المنافذ**
```bash
# التحقق من المنافذ المستخدمة
netstat -tlnp | grep :3000
netstat -tlnp | grep :8000

# إنهاء العمليات المتعارضة
pkill -f "node.*3000"
pkill -f "python.*8000"
```

## 🌐 النشر في الإنتاج

### **إعداد متغيرات الإنتاج**
```bash
# تعديل .env للإنتاج
NODE_ENV=production
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://your-domain.com"
```

### **بناء المشروع**
```bash
# بناء Next.js
npm run build

# بناء خدمة ML
cd ml-services
pip3 install -r requirements.txt
cd ..
```

### **النشر مع Docker**
```bash
# بناء الصورة
docker build -t sabq-ai .

# تشغيل الحاوية
docker run -p 3000:3000 -p 8000:8000 sabq-ai
```

### **النشر مع PM2**
```bash
# تثبيت PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start npm --name "sabq-ai" -- start

# تشغيل خدمة ML
pm2 start python3 --name "sabq-ml" -- -m uvicorn nlp.app:app --host 0.0.0.0 --port 8000
```

## 📈 تحسين الأداء

### **إعدادات الأداء**
```bash
# تمكين ضغط البيانات
ENABLE_COMPRESSION=true

# تحسين حجم الدفعة
ANALYTICS_BATCH_SIZE=200

# تحسين فترة التنظيف
ANALYTICS_FLUSH_INTERVAL=3000
```

### **مراقبة الذاكرة**
```bash
# مراقبة استخدام الذاكرة
free -h

# تحسين Node.js
node --max-old-space-size=4096 app.js
```

## 🔒 الأمان

### **إعدادات الأمان**
```bash
# تشفير قوي
ENCRYPTION_KEY="your-32-character-encryption-key"

# تحديد معدل الطلبات
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# تمكين HTTPS في الإنتاج
USE_HTTPS=true
```

### **نسخ احتياطية**
```bash
# نسخ احتياطي لقاعدة البيانات
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# نسخ احتياطي للتكوين
cp .env .env.backup
```

## 📋 قائمة المراجعة

### **قبل النشر**
- [ ] تحديث متغيرات البيئة
- [ ] اختبار جميع APIs
- [ ] فحص الأمان
- [ ] إعداد النسخ الاحتياطية
- [ ] تكوين مراقبة الأداء
- [ ] اختبار الأحمال

### **بعد النشر**
- [ ] مراقبة السجلات
- [ ] فحص الأداء
- [ ] اختبار الوظائف الأساسية
- [ ] تحديث الوثائق
- [ ] إعلام الفريق

## 📞 الدعم

### **في حالة وجود مشاكل**
1. 📋 راجع سجلات الأخطاء
2. 🔍 استخدم سكريبت الاختبار
3. 📖 راجع هذا الدليل
4. 💬 اتصل بالدعم الفني

### **موارد إضافية**
- [📚 وثائق API](docs/API_DOCUMENTATION.md)
- [🔧 دليل التطوير](docs/DEVELOPMENT_GUIDE.md)
- [🧪 دليل الاختبار](docs/TESTING_GUIDE.md)
- [🛠️ استكشاف الأخطاء](docs/TROUBLESHOOTING.md)

---

**آخر تحديث**: 2024-01-15  
**الإصدار**: 5.0.0  
**المطور**: فريق سبق الذكي 