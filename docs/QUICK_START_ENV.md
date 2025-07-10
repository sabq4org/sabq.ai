# البدء السريع - إعداد البيئة
## Quick Start - Environment Setup

### المحتويات
1. [المتطلبات الأساسية](#المتطلبات-الأساسية)
2. [التثبيت السريع](#التثبيت-السريع)
3. [إعداد متغيرات البيئة](#إعداد-متغيرات-البيئة)
4. [تشغيل التطبيق](#تشغيل-التطبيق)
5. [التحقق من التثبيت](#التحقق-من-التثبيت)
6. [استكشاف الأخطاء](#استكشاف-الأخطاء)

## المتطلبات الأساسية

قبل البدء، تأكد من توفر هذه الأدوات:

### الأدوات المطلوبة
- **Node.js** (الإصدار 18.0.0 أو أحدث)
- **npm** (الإصدار 8.0.0 أو أحدث) أو **yarn**
- **Git** لاستنساخ المستودع
- **محرر نصوص** (VS Code مُوصى به)

### فحص الإصدارات

```bash
# فحص إصدار Node.js
node --version
# يجب أن يكون >= 18.0.0

# فحص إصدار npm
npm --version
# يجب أن يكون >= 8.0.0

# فحص إصدار Git
git --version
```

## التثبيت السريع

### 1. استنساخ المستودع

```bash
# استنساخ المستودع
git clone https://github.com/sabq4org/sabq-ai-cms.git

# الانتقال إلى مجلد المشروع
cd sabq-ai-cms

# فحص الفروع المتاحة
git branch -a
```

### 2. تثبيت التبعيات

```bash
# تثبيت جميع التبعيات
npm install

# أو باستخدام yarn
yarn install

# تثبيت التبعيات العالمية (اختياري)
npm install -g @next/codemod typescript
```

### 3. إعداد قاعدة البيانات (اختياري)

```bash
# إذا كنت تستخدم Prisma
npx prisma generate
npx prisma db push

# إذا كنت تستخدم Supabase
# ستحتاج إلى إعداد متغيرات البيئة أولاً
```

## إعداد متغيرات البيئة

### 1. إنشاء ملف البيئة

```bash
# نسخ ملف البيئة المثال
cp .env.example .env.local

# أو إنشاء ملف جديد
touch .env.local
```

### 2. متغيرات البيئة الأساسية

أضف هذه المتغيرات إلى ملف `.env.local`:

```env
# معلومات التطبيق الأساسية
NEXT_PUBLIC_APP_NAME="سبق AI CMS"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# أمان التطبيق
NEXTAUTH_SECRET="your-32-character-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# تشفير البيانات (مطلوب)
ENCRYPTION_KEY="your-32-character-encryption-key"
ENCRYPTION_IV="your-16-character-iv"

# Supabase (قاعدة البيانات)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Cloudinary (إدارة الصور)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# OpenAI (ذكاء اصطناعي)
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_ORGANIZATION="org-your-organization-id"

# Anthropic (ذكاء اصطناعي)
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"

# Google Analytics (تحليلات)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# إعدادات التطوير
DEBUG_MODE="true"
LOG_LEVEL="debug"
```

### 3. توليد مفاتيح التشفير

```bash
# توليد مفتاح تشفير 32 حرف
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# توليد IV بطول 16 حرف
node -e "console.log('ENCRYPTION_IV=' + require('crypto').randomBytes(16).toString('hex'))"

# توليد NextAuth Secret
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 4. إعداد Supabase

#### إنشاء مشروع Supabase جديد:

1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ حساب جديد أو سجل الدخول
3. أنشئ مشروع جديد
4. انسخ URL ومفاتيح API من إعدادات المشروع

#### إعداد الجداول:

```sql
-- جدول المستخدمين
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'subscriber',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المقالات
CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  author_id UUID REFERENCES users(id),
  category VARCHAR(100),
  tags TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. إعداد Cloudinary

1. اذهب إلى [cloudinary.com](https://cloudinary.com)
2. أنشئ حساب مجاني
3. من Dashboard، انسخ:
   - Cloud name
   - API Key
   - API Secret

## تشغيل التطبيق

### 1. وضع التطوير

```bash
# تشغيل خادم التطوير
npm run dev

# أو باستخدام yarn
yarn dev

# أو باستخدام pnpm
pnpm dev

# أو باستخدام bun
bun dev
```

### 2. تشغيل خدمات إضافية

```bash
# تشغيل خدمات الذكاء الاصطناعي (في terminal منفصل)
cd ml-services
docker-compose up -d

# أو تشغيل مباشر
python app.py
```

### 3. فتح التطبيق

افتح المتصفح واذهب إلى:
- **التطبيق الرئيسي**: http://localhost:3000
- **API التطبيق**: http://localhost:3000/api
- **خدمات ML**: http://localhost:8000

## التحقق من التثبيت

### 1. فحص الصفحة الرئيسية

```bash
# التحقق من استجابة الخادم
curl http://localhost:3000

# التحقق من API
curl http://localhost:3000/api/health
```

### 2. فحص قاعدة البيانات

```bash
# اختبار الاتصال بـ Supabase
curl -H "apikey: YOUR_SUPABASE_ANON_KEY" \
     "https://your-project.supabase.co/rest/v1/"
```

### 3. فحص الخدمات الخارجية

```bash
# اختبار Cloudinary
curl -X POST \
  "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload" \
  -F "upload_preset=YOUR_PRESET" \
  -F "file=@test-image.jpg"

# اختبار OpenAI
curl -H "Authorization: Bearer YOUR_OPENAI_KEY" \
     "https://api.openai.com/v1/models"
```

### 4. اختبار الميزات الأساسية

#### إنشاء مستخدم تجريبي:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpassword123",
    "fullName": "مستخدم تجريبي",
    "acceptTerms": true
  }'
```

#### إنشاء مقال تجريبي:

```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "مقال تجريبي",
    "content": "محتوى المقال التجريبي",
    "category": "تقنية",
    "published": true
  }'
```

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. خطأ في تثبيت التبعيات

```bash
❌ npm ERR! peer dep missing
```

**الحل:**
```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install

# أو استخدام --legacy-peer-deps
npm install --legacy-peer-deps
```

#### 2. خطأ في متغيرات البيئة

```bash
❌ Error: Environment variable SUPABASE_URL is not defined
```

**الحل:**
```bash
# التأكد من وجود ملف .env.local
ls -la | grep .env

# فحص محتوى الملف
cat .env.local

# إعادة تشغيل الخادم بعد تحديث المتغيرات
npm run dev
```

#### 3. خطأ في اتصال قاعدة البيانات

```bash
❌ Failed to connect to Supabase
```

**الحل:**
```bash
# فحص صحة URL ومفاتيح Supabase
curl -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/"

# التأكد من أن المشروع نشط في Supabase
# فحص إعدادات المصادقة والأمان
```

#### 4. خطأ في منافذ الشبكة

```bash
❌ Port 3000 is already in use
```

**الحل:**
```bash
# العثور على العملية التي تستخدم المنفذ
lsof -ti:3000

# إنهاء العملية
kill -9 $(lsof -ti:3000)

# أو استخدام منفذ مختلف
PORT=3001 npm run dev
```

#### 5. مشاكل الذاكرة

```bash
❌ JavaScript heap out of memory
```

**الحل:**
```bash
# زيادة حد الذاكرة
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev

# أو إضافة في package.json
"scripts": {
  "dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev"
}
```

### أدوات التشخيص

#### 1. فحص حالة الخدمات

```bash
# إنشاء سكريبت فحص الصحة
cat > health-check.js << 'EOF'
const https = require('https');
const http = require('http');

const services = [
  { name: 'Local App', url: 'http://localhost:3000/api/health' },
  { name: 'Supabase', url: process.env.SUPABASE_URL + '/rest/v1/' },
  { name: 'OpenAI', url: 'https://api.openai.com/v1/models' }
];

services.forEach(service => {
  const client = service.url.startsWith('https') ? https : http;
  client.get(service.url, (res) => {
    console.log(`✅ ${service.name}: ${res.statusCode}`);
  }).on('error', (err) => {
    console.log(`❌ ${service.name}: ${err.message}`);
  });
});
EOF

node health-check.js
```

#### 2. مراقبة اللوغات

```bash
# مراقبة لوغات التطوير
npm run dev 2>&1 | tee development.log

# مراقبة لوغات النظام
tail -f /var/log/system.log | grep node
```

#### 3. فحص الأداء

```bash
# قياس وقت التحميل
time curl -s http://localhost:3000 > /dev/null

# فحص استخدام الذاكرة
ps aux | grep node
```

### إعداد IDE (VS Code)

#### 1. الإضافات الموصى بها

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-json"
  ]
}
```

#### 2. إعدادات المشروع

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.autoFixOnSave": true,
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## السكريبتات المفيدة

### 1. سكريبت الإعداد التلقائي

```bash
#!/bin/bash
# setup.sh

echo "🚀 بدء إعداد Sabq AI CMS..."

# فحص Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيته من nodejs.org"
    exit 1
fi

# تثبيت التبعيات
echo "📦 تثبيت التبعيات..."
npm install

# إنشاء ملف البيئة
if [ ! -f .env.local ]; then
    echo "⚙️ إنشاء ملف البيئة..."
    cp .env.example .env.local
    
    # توليد مفاتيح التشفير
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    ENCRYPTION_IV=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
    NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # تحديث ملف البيئة
    sed -i.bak "s/your-32-character-encryption-key/$ENCRYPTION_KEY/g" .env.local
    sed -i.bak "s/your-16-character-iv/$ENCRYPTION_IV/g" .env.local
    sed -i.bak "s/your-32-character-secret-key-here/$NEXTAUTH_SECRET/g" .env.local
    
    echo "🔐 تم توليد مفاتيح التشفير"
fi

echo "✅ تم الإعداد بنجاح!"
echo "📝 يرجى تحديث متغيرات البيئة في .env.local"
echo "🚀 شغل التطبيق بالأمر: npm run dev"
```

### 2. سكريبت التحقق من الصحة

```bash
#!/bin/bash
# health-check.sh

echo "🔍 فحص حالة التطبيق..."

# فحص الخادم المحلي
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ الخادم المحلي يعمل"
else
    echo "❌ الخادم المحلي لا يعمل"
fi

# فحص متغيرات البيئة
if [ -f .env.local ]; then
    echo "✅ ملف البيئة موجود"
    
    # فحص المتغيرات المطلوبة
    required_vars=("SUPABASE_URL" "NEXTAUTH_SECRET" "ENCRYPTION_KEY")
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env.local; then
            echo "✅ $var محدد"
        else
            echo "❌ $var غير محدد"
        fi
    done
else
    echo "❌ ملف البيئة غير موجود"
fi

echo "✅ انتهى الفحص"
```

### 3. سكريبت النسخ الاحتياطي

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo "💾 إنشاء نسخة احتياطية..."

# نسخ ملفات البيئة
cp .env.local $BACKUP_DIR/ 2>/dev/null || echo "ملف البيئة غير موجود"

# نسخ قاعدة البيانات (إذا كانت محلية)
if [ -f "database.db" ]; then
    cp database.db $BACKUP_DIR/
fi

# ضغط الملفات
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR/
rm -rf $BACKUP_DIR

echo "✅ تم إنشاء النسخة الاحتياطية: $BACKUP_DIR.tar.gz"
```

## الخطوات التالية

بعد إعداد البيئة بنجاح:

1. **📖 اقرأ الوثائق الكاملة** في مجلد `docs/`
2. **🔧 خصص الإعدادات** حسب احتياجاتك
3. **🎨 طور الواجهة** باستخدام المكونات الجاهزة
4. **🤖 استخدم خدمات الذكاء الاصطناعي** لإنتاج المحتوى
5. **📊 راقب الأداء** باستخدام أدوات التحليل
6. **🚀 انشر التطبيق** على Vercel أو منصة أخرى

## الدعم والمساعدة

- 📧 **البريد الإلكتروني**: support@sabq.ai
- 💬 **Discord**: [رابط الخادم]
- 📚 **الوثائق**: [docs.sabq.ai](https://docs.sabq.ai)
- 🐛 **المشاكل**: [GitHub Issues](https://github.com/sabq4org/sabq-ai-cms/issues)

---

**آخر تحديث**: ديسمبر 2024  
**الإصدار**: 1.0.0  
**الحالة**: ✅ جاهز للاستخدام 