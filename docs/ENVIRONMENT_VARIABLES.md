# دليل متغيرات البيئة لمنصة سبق الذكية

## المتغيرات المطلوبة

### 1. قاعدة البيانات (PlanetScale)

```env
# قاعدة البيانات الرئيسية
DATABASE_URL="mysql://[username]:[password]@[host]/[database]?sslaccept=strict"

# مثال:
DATABASE_URL="mysql://abc123def456@aws.connect.psdb.cloud/sabq-ai-prod?sslaccept=strict"

# قاعدة البيانات للبيئة التجريبية
DATABASE_URL_STAGING="mysql://[username]:[password]@[host]/[database-staging]?sslaccept=strict"

# قاعدة البيانات للتطوير (اختياري)
DATABASE_URL_DEV="mysql://[username]:[password]@[host]/[database-dev]?sslaccept=strict"
```

### 2. التخزين المؤقت (Upstash Redis)

```env
# Redis الرئيسي
UPSTASH_REDIS_REST_URL="https://[endpoint].upstash.io"
UPSTASH_REDIS_REST_TOKEN="[your-token]"

# Redis للبيئة التجريبية
UPSTASH_REDIS_REST_URL_STAGING="https://[staging-endpoint].upstash.io"
UPSTASH_REDIS_REST_TOKEN_STAGING="[staging-token]"
```

### 3. البيئة والإعدادات

```env
# بيئة Node.js
NODE_ENV="development" # development | production | test

# بيئة التطبيق
APP_ENV="development" # development | staging | production

# حماية قاعدة البيانات
ENABLE_DB_PROTECTION="false" # يجب أن يكون true في production
```

### 4. التخزين السحابي (Cloudinary)

```env
CLOUDINARY_CLOUD_NAME="[your-cloud-name]"
CLOUDINARY_API_KEY="[your-api-key]"
CLOUDINARY_API_SECRET="[your-api-secret]"
```

### 5. المصادقة والأمان

```env
# JWT للمصادقة
JWT_SECRET="[your-jwt-secret-key-min-32-chars]"

# NextAuth
NEXTAUTH_URL="http://localhost:3000" # أو URL الموقع في production
NEXTAUTH_SECRET="[your-nextauth-secret-min-32-chars]"
```

### 6. البريد الإلكتروني

```env
# إعدادات SMTP
EMAIL_FROM="noreply@sabq-ai.com"
EMAIL_SMTP_HOST="smtp.example.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="[smtp-username]"
EMAIL_SMTP_PASS="[smtp-password]"
```

### 7. الذكاء الاصطناعي

```env
# OpenAI API
OPENAI_API_KEY="sk-[your-openai-api-key]"
```

### 8. التحليلات (اختياري)

```env
# Google Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

### 9. Vercel (إذا كنت تستخدم Vercel)

```env
VERCEL_ENV="development" # preview | production
```

## كيفية الحصول على هذه المتغيرات

### PlanetScale
1. سجل في https://planetscale.com
2. أنشئ قاعدة بيانات جديدة
3. من "Connect" > "Prisma" احصل على connection string

### Upstash Redis
1. سجل في https://upstash.com
2. أنشئ قاعدة Redis جديدة
3. من "Details" احصل على REST URL و Token

### Cloudinary
1. سجل في https://cloudinary.com
2. من Dashboard احصل على:
   - Cloud Name
   - API Key
   - API Secret

### JWT و NextAuth Secrets
```bash
# توليد secret آمن
openssl rand -base64 32
```

## نصائح الأمان

1. **لا تشارك ملف .env أبداً** في Git
2. **استخدم secrets مختلفة** لكل بيئة
3. **قم بتدوير المفاتيح** بشكل دوري
4. **استخدم أدوات إدارة secrets** مثل:
   - Vercel Environment Variables
   - GitHub Secrets
   - AWS Secrets Manager

## مثال كامل لملف .env

```env
# Database
DATABASE_URL="mysql://abc123def456@aws.connect.psdb.cloud/sabq-ai-prod?sslaccept=strict"
DATABASE_URL_STAGING="mysql://xyz789ghi012@aws.connect.psdb.cloud/sabq-ai-staging?sslaccept=strict"

# Redis
UPSTASH_REDIS_REST_URL="https://us1-example-12345.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AX4zASQgNmE5..."

# Environment
NODE_ENV="development"
APP_ENV="development"
ENABLE_DB_PROTECTION="false"

# Cloudinary
CLOUDINARY_CLOUD_NAME="sabq-ai"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abc-xyz-123"

# Auth
JWT_SECRET="your-super-secret-jwt-key-here-32-chars-min"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-nextauth-key-here"

# Email
EMAIL_FROM="noreply@sabq-ai.com"
EMAIL_SMTP_HOST="smtp.gmail.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="your-email@gmail.com"
EMAIL_SMTP_PASS="your-app-password"

# AI
OPENAI_API_KEY="sk-proj-abc123xyz789"

# Analytics
NEXT_PUBLIC_GA_ID="G-ABC123XYZ"
``` 