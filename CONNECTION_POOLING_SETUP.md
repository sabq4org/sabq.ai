# دليل إعداد Connection Pooling لمشروع سبق

## نظرة عامة
Connection Pooling هو تقنية لتحسين أداء قاعدة البيانات عبر إعادة استخدام الاتصالات بدلاً من إنشاء اتصال جديد لكل طلب.

## الخطوة 1: إنشاء ملف .env

أنشئ ملف `.env` في المجلد الرئيسي للمشروع:

```bash
touch .env
```

## الخطوة 2: إضافة متغيرات البيئة

أضف المتغيرات التالية إلى ملف `.env`:

```env
# ==============================================
# إعدادات قاعدة البيانات مع Connection Pooling
# ==============================================

# رابط Connection Pool (استخدم هذا في التطبيق)
DATABASE_URL=postgres://postgres.apbkobhfnmcqqzqeeqss:[YOUR_PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres

# رابط الاتصال المباشر (للـ migrations فقط)
DIRECT_URL=postgres://postgres.apbkobhfnmcqqzqeeqss:[YOUR_PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres

# إعدادات Connection Pool
DATABASE_POOL_SIZE=10
DATABASE_POOL_TIMEOUT=30
DATABASE_CONNECTION_LIMIT=50

# إعدادات Prisma
PRISMA_HIDE_UPDATE_MESSAGE=true

# ==============================================
# إعدادات التطبيق
# ==============================================

# Next.js Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="صحيفة سبق الإلكترونية"
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this

# ==============================================
# خدمات خارجية (اختياري)
# ==============================================

# Cloudinary (للصور)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@sabq-ai-cms.com

# ==============================================
# إعدادات النظام
# ==============================================

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_LOYALTY_SYSTEM=true
ENABLE_COMMENTS=true

# System Limits
MAX_UPLOAD_SIZE=10485760  # 10MB
MAX_ARTICLES_PER_PAGE=20
SESSION_TIMEOUT=86400  # 24 hours
```

## الخطوة 3: تحديث Prisma Schema

تأكد من أن ملف `prisma/schema.prisma` يحتوي على الإعدادات الصحيحة:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## الخطوة 4: تحديث إعدادات Prisma Client

أنشئ أو حدث ملف `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Connection pool configuration
export const dbConfig = {
  pool: {
    min: 2,
    max: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
    idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_TIMEOUT || '30000'),
  },
}
```

## الخطوة 5: تطبيق Migrations

```bash
# توليد Prisma Client
npx prisma generate

# تطبيق migrations (استخدم DIRECT_URL)
npx prisma migrate deploy
```

## الخطوة 6: التحقق من الاتصال

أنشئ سكريبت للتحقق من الاتصال:

```bash
# test-connection.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح')
    
    // اختبار query بسيط
    const count = await prisma.users.count()
    console.log(`📊 عدد المستخدمين: ${count}`)
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ فشل الاتصال:', error)
  }
}

testConnection()
```

## الخطوة 7: أفضل الممارسات

### 1. استخدام Connection Pool URL للتطبيق
```javascript
// في التطبيق
const dbUrl = process.env.DATABASE_URL // استخدم Pool URL
```

### 2. استخدام Direct URL للـ Migrations فقط
```bash
# في package.json scripts
"migrate": "DATABASE_URL=$DIRECT_URL prisma migrate deploy"
```

### 3. إعدادات الأداء المثلى
```env
# لتطبيق صغير إلى متوسط
DATABASE_POOL_SIZE=10
DATABASE_CONNECTION_LIMIT=50

# لتطبيق كبير
DATABASE_POOL_SIZE=25
DATABASE_CONNECTION_LIMIT=100
```

### 4. مراقبة الاتصالات
```javascript
// في middleware أو health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ 
      status: 'healthy',
      database: 'connected'
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      database: 'disconnected'
    })
  }
})
```

## الخطوة 8: نصائح للإنتاج

1. **استخدم SSL دائماً**
   ```
   ?sslmode=require
   ```

2. **قم بتشفير كلمات المرور**
   - استخدم خدمات مثل AWS Secrets Manager أو Vercel Environment Variables

3. **راقب الأداء**
   - استخدم Supabase Dashboard لمراقبة استخدام Connection Pool

4. **تعامل مع الأخطاء**
   ```javascript
   try {
     // database operation
   } catch (error) {
     if (error.code === 'P2024') {
       console.error('Connection pool timeout')
     }
   }
   ```

## استكشاف الأخطاء

### خطأ: "Too many connections"
- قلل `DATABASE_POOL_SIZE`
- تحقق من عدم وجود connection leaks

### خطأ: "Connection timeout"
- زد `DATABASE_POOL_TIMEOUT`
- تحقق من أداء الشبكة

### خطأ: "SSL connection required"
- تأكد من إضافة `?sslmode=require` في نهاية DATABASE_URL

## الموارد المفيدة

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [PgBouncer Documentation](https://www.pgbouncer.org/) 