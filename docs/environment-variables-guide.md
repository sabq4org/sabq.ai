# 🌐 دليل متغيرات البيئة - سبق الذكية CMS

## 📋 نظرة عامة

يحتوي هذا الدليل على تفاصيل شاملة لجميع متغيرات البيئة المطلوبة لتشغيل نظام سبق الذكية CMS بشكل صحيح. تأكد من إعداد جميع المتغيرات المطلوبة قبل تشغيل التطبيق.

---

## 🚀 البداية السريعة

### 1. نسخ ملف البيئة

```bash
# نسخ ملف البيئة المثال
cp env.example.updated .env

# أو إنشاء ملف جديد
touch .env
```

### 2. تحرير المتغيرات

```bash
# تحرير ملف البيئة
nano .env
# أو
vim .env
```

### 3. التحقق من صحة المتغيرات

```bash
# تشغيل سكريبت التحقق
npm run validate-env
# أو
yarn validate-env
```

---

## 🏗️ المتغيرات الأساسية

### قاعدة البيانات (Database)

```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://username:password@localhost:5432/sabq_cms"

# أو Supabase Database URL
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"

# Direct URL for migrations (Supabase)
DIRECT_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
```

**الوصف:**
- `DATABASE_URL`: رابط الاتصال بقاعدة البيانات الرئيسية
- `DIRECT_URL`: رابط مباشر للهجرات (مطلوب للـ Supabase)

**مثال محلي:**
```env
DATABASE_URL="postgresql://sabq_user:secure_password@localhost:5432/sabq_cms_dev"
```

**مثال Supabase:**
```env
DATABASE_URL="postgresql://postgres.xxxxxxxxxxxxxxxxxxxx:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.xxxxxxxxxxxxxxxxxxxx:your_password@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

### NextAuth.js

```env
# Next Auth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here-make-it-long-and-random"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

**الوصف:**
- `NEXTAUTH_URL`: رابط التطبيق الأساسي
- `NEXTAUTH_SECRET`: مفتاح التشفير السري (مطلوب للإنتاج)

**إنشاء مفتاح سري:**
```bash
# إنشاء مفتاح عشوائي
openssl rand -base64 32
```

---

## ☁️ خدمات السحابة

### Supabase

```env
# Supabase Configuration
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_JWT_SECRET="your-jwt-secret"

# Storage
SUPABASE_STORAGE_BUCKET="media-files"
```

**الحصول على المتغيرات:**
1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. اذهب إلى Settings > API
4. انسخ القيم المطلوبة

### Cloudinary

```env
# Cloudinary Media Management
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_SECURE="true"
```

**الحصول على المتغيرات:**
1. إنشاء حساب في [Cloudinary](https://cloudinary.com/)
2. اذهب إلى Dashboard
3. انسخ Cloud Name, API Key, و API Secret

### AWS (اختياري)

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="sabq-cms-media"

# CloudFront CDN
CLOUDFRONT_DISTRIBUTION_ID="your-distribution-id"
CLOUDFRONT_DOMAIN_NAME="your-domain.cloudfront.net"
```

---

## 🤖 خدمات الذكاء الاصطناعي

### OpenAI

```env
# OpenAI Configuration
OPENAI_API_KEY="sk-your-api-key-here"
OPENAI_ORG_ID="org-your-organization-id"
OPENAI_MODEL_TEXT="gpt-4-turbo-preview"
OPENAI_MODEL_EMBEDDING="text-embedding-ada-002"
OPENAI_MODEL_IMAGE="dall-e-3"
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7
```

**الحصول على API Key:**
1. اذهب إلى [OpenAI Platform](https://platform.openai.com/)
2. إنشاء حساب أو تسجيل دخول
3. اذهب إلى API Keys
4. إنشاء مفتاح جديد

### Anthropic Claude

```env
# Anthropic Configuration
ANTHROPIC_API_KEY="sk-ant-your-api-key"
ANTHROPIC_MODEL="claude-3-sonnet-20240229"
ANTHROPIC_MAX_TOKENS=4096
ANTHROPIC_TEMPERATURE=0.7
```

### Google AI (اختياري)

```env
# Google AI Configuration
GOOGLE_AI_API_KEY="your-google-ai-key"
GOOGLE_AI_PROJECT_ID="your-project-id"
```

---

## 📧 خدمات البريد الإلكتروني

### SMTP العام

```env
# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="سبق الذكية <noreply@sabq.ai>"
```

### SendGrid

```env
# SendGrid Configuration
SENDGRID_API_KEY="SG.your-api-key"
SENDGRID_FROM_EMAIL="noreply@sabq.ai"
SENDGRID_FROM_NAME="سبق الذكية"
```

### Resend

```env
# Resend Configuration
RESEND_API_KEY="re_your-api-key"
RESEND_FROM_EMAIL="noreply@sabq.ai"
```

---

## 📱 خدمات الإشعارات

### Firebase

```env
# Firebase Configuration
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY_ID="your-private-key-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
FIREBASE_CLIENT_ID="your-client-id"
FIREBASE_AUTH_URI="https://accounts.google.com/o/oauth2/auth"
FIREBASE_TOKEN_URI="https://oauth2.googleapis.com/token"

# FCM
FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
FIREBASE_APP_ID="your-app-id"
FIREBASE_VAPID_KEY="your-vapid-key"
```

### OneSignal (اختياري)

```env
# OneSignal Configuration
ONESIGNAL_APP_ID="your-app-id"
ONESIGNAL_API_KEY="your-api-key"
ONESIGNAL_USER_AUTH_KEY="your-user-auth-key"
```

---

## 💳 خدمات المدفوعات

### Stripe

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY="pk_test_your-publishable-key"
STRIPE_SECRET_KEY="sk_test_your-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
STRIPE_CURRENCY="SAR"
STRIPE_SUCCESS_URL="http://localhost:3000/payment/success"
STRIPE_CANCEL_URL="http://localhost:3000/payment/cancel"
```

### PayPal (اختياري)

```env
# PayPal Configuration
PAYPAL_CLIENT_ID="your-client-id"
PAYPAL_CLIENT_SECRET="your-client-secret"
PAYPAL_MODE="sandbox"  # أو "live" للإنتاج
```

---

## 🔍 خدمات البحث

### Algolia

```env
# Algolia Search Configuration
ALGOLIA_APPLICATION_ID="your-app-id"
ALGOLIA_ADMIN_API_KEY="your-admin-key"
ALGOLIA_SEARCH_API_KEY="your-search-key"
ALGOLIA_INDEX_NAME="sabq_articles"
```

### Elasticsearch (اختياري)

```env
# Elasticsearch Configuration
ELASTICSEARCH_URL="http://localhost:9200"
ELASTICSEARCH_USERNAME="elastic"
ELASTICSEARCH_PASSWORD="your-password"
ELASTICSEARCH_INDEX="sabq_cms"
```

---

## 📊 خدمات التحليلات

### Google Analytics

```env
# Google Analytics Configuration
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
GOOGLE_TAG_MANAGER_ID="GTM-XXXXXXX"
```

### Facebook Pixel

```env
# Facebook Pixel Configuration
FACEBOOK_PIXEL_ID="your-pixel-id"
```

### Mixpanel (اختياري)

```env
# Mixpanel Configuration
MIXPANEL_TOKEN="your-mixpanel-token"
```

---

## 📞 خدمات الاتصالات

### Twilio

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

### SMS Local Provider

```env
# Local SMS Provider
SMS_PROVIDER_URL="https://api.local-sms.com/send"
SMS_PROVIDER_KEY="your-api-key"
SMS_FROM_NUMBER="+966501234567"
```

---

## 🗄️ خدمات التخزين المؤقت

### Redis

```env
# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your-redis-password"
REDIS_DB=0
REDIS_TTL=3600
```

### Upstash Redis

```env
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

---

## 🔐 الأمان والمراقبة

### Security

```env
# Security Configuration
ENCRYPTION_KEY="your-32-character-encryption-key"
JWT_SECRET="your-jwt-secret-key"
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=3600
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900

# CORS
CORS_ORIGIN="http://localhost:3000,https://yourdomain.com"
```

### Rate Limiting

```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true
```

### Monitoring

```env
# Monitoring Configuration
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
LOG_LEVEL="info"
LOG_FILE_PATH="./logs/app.log"
```

---

## 🌍 إعدادات التطبيق

### Application

```env
# Application Configuration
NODE_ENV="development"  # أو "production"
PORT=3000
APP_NAME="سبق الذكية CMS"
APP_URL="http://localhost:3000"
APP_VERSION="1.0.0"

# Localization
DEFAULT_LOCALE="ar"
SUPPORTED_LOCALES="ar,en"
TIMEZONE="Asia/Riyadh"
```

### Features

```env
# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_COMMENTS=true
ENABLE_SUBSCRIPTIONS=true
ENABLE_NOTIFICATIONS=true
ENABLE_ML_RECOMMENDATIONS=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_PWA=true
ENABLE_OFFLINE_MODE=false
```

---

## 🎯 البيئات المختلفة

### Development (.env.development)

```env
NODE_ENV=development
DATABASE_URL="postgresql://user:pass@localhost:5432/sabq_dev"
NEXTAUTH_URL="http://localhost:3000"
LOG_LEVEL="debug"
ENABLE_DEBUG_TOOLS=true
```

### Testing (.env.test)

```env
NODE_ENV=test
DATABASE_URL="postgresql://user:pass@localhost:5432/sabq_test"
NEXTAUTH_URL="http://localhost:3001"
DISABLE_RATE_LIMITING=true
MOCK_EXTERNAL_APIS=true
```

### Production (.env.production)

```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://yourdomain.com"
LOG_LEVEL="error"
ENABLE_DEBUG_TOOLS=false
```

---

## ✅ قائمة التحقق

### متغيرات مطلوبة ✓

- [ ] `DATABASE_URL` - رابط قاعدة البيانات
- [ ] `NEXTAUTH_URL` - رابط التطبيق
- [ ] `NEXTAUTH_SECRET` - مفتاح التشفير
- [ ] `SUPABASE_URL` - رابط Supabase
- [ ] `SUPABASE_ANON_KEY` - مفتاح Supabase العام
- [ ] `OPENAI_API_KEY` - مفتاح OpenAI (اختياري للـ AI)

### متغيرات اختيارية

- [ ] `CLOUDINARY_CLOUD_NAME` - لإدارة الوسائط
- [ ] `STRIPE_SECRET_KEY` - للمدفوعات
- [ ] `ALGOLIA_APPLICATION_ID` - للبحث المتقدم
- [ ] `FIREBASE_PROJECT_ID` - للإشعارات
- [ ] `TWILIO_ACCOUNT_SID` - للرسائل النصية

---

## 🔧 أدوات التحقق

### سكريبت التحقق الأساسي

```bash
#!/bin/bash
# scripts/check-env.sh

echo "🔍 فحص متغيرات البيئة..."

# فحص المتغيرات المطلوبة
required_vars=(
  "DATABASE_URL"
  "NEXTAUTH_URL"
  "NEXTAUTH_SECRET"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ متغير مفقود: $var"
    exit 1
  else
    echo "✅ $var موجود"
  fi
done

echo "🎉 جميع المتغيرات المطلوبة موجودة!"
```

### استخدام أداة التحقق المتقدمة

```bash
# تشغيل أداة التحقق الشاملة
npm run validate-env

# أو مع تفاصيل إضافية
npm run validate-env -- --detailed

# فحص بيئة محددة
npm run validate-env -- --env=production
```

---

## 🚨 أمان متغيرات البيئة

### نصائح الأمان

1. **لا تضع المتغيرات في Git:**
   ```bash
   # إضافة إلى .gitignore
   echo ".env*" >> .gitignore
   echo "!.env.example" >> .gitignore
   ```

2. **استخدام مفاتيح قوية:**
   ```bash
   # إنشاء مفاتيح آمنة
   openssl rand -hex 32
   ```

3. **تشفير المتغيرات الحساسة:**
   ```bash
   # تشفير قاعدة البيانات
   gpg --symmetric --armor .env
   ```

4. **استخدام خدمات إدارة الأسرار:**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

### متغيرات للإنتاج

```env
# Production Security
FORCE_HTTPS=true
SECURE_COOKIES=true
CSRF_PROTECTION=true
HELMET_ENABLED=true
```

---

## 📚 مراجع مفيدة

### مولدات المفاتيح

- [Random.org](https://www.random.org/passwords/)
- [LastPass Password Generator](https://www.lastpass.com/password-generator)
- [1Password Password Generator](https://1password.com/password-generator/)

### خدمات البيئة

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Railway Environment Variables](https://docs.railway.app/deploy/environment-variables)

### أدوات التحقق

- [dotenv-linter](https://github.com/dotenv-linter/dotenv-linter)
- [env-cmd](https://github.com/toddbluhm/env-cmd)
- [cross-env](https://github.com/kentcdodds/cross-env)

---

## 🆘 استكشاف الأخطاء

### مشاكل شائعة

#### خطأ: Database connection failed
```bash
# تحقق من رابط قاعدة البيانات
echo $DATABASE_URL

# اختبار الاتصال
psql $DATABASE_URL -c "SELECT 1;"
```

#### خطأ: NextAuth configuration error
```bash
# تحقق من المتغيرات
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET

# إنشاء مفتاح جديد
openssl rand -base64 32
```

#### خطأ: OpenAI API quota exceeded
```bash
# تحقق من حدود الاستخدام
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  "https://api.openai.com/v1/usage"
```

### رسائل الخطأ الشائعة

| الخطأ | السبب | الحل |
|-------|--------|------|
| `Invalid database URL` | رابط قاعدة البيانات خاطئ | تحقق من `DATABASE_URL` |
| `NEXTAUTH_SECRET missing` | مفتاح التشفير مفقود | أضف `NEXTAUTH_SECRET` |
| `Supabase connection failed` | إعدادات Supabase خاطئة | تحقق من مفاتيح Supabase |
| `OpenAI API error` | مفتاح OpenAI خاطئ أو منتهي | جدد مفتاح OpenAI |

---

**💡 نصيحة:** احتفظ بنسخة احتياطية من ملف `.env` في مكان آمن، ولا تشاركه أبداً في أماكن عامة!

**🔗 روابط مفيدة:**
- [دليل إعداد Supabase](./INTEGRATIONS_README.md#supabase)
- [دليل إعداد قاعدة البيانات](./DATABASE_SETUP_GUIDE.md)
- [دليل الأمان](./privacy-policy-enhanced.md) 