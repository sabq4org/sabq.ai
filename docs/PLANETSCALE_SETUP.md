# دليل إعداد PlanetScale لمنصة سبق الذكية

## لماذا PlanetScale؟

### المميزات الرئيسية:
- ✅ **Serverless MySQL**: لا حاجة لإدارة الخوادم
- ✅ **Auto-scaling**: يتوسع تلقائياً مع نمو المشروع
- ✅ **Zero downtime migrations**: تحديث الـ schema بدون توقف
- ✅ **Built-in connection pooling**: إدارة ذكية للاتصالات
- ✅ **Global replication**: نسخ احتياطية في مناطق متعددة
- ✅ **خطة مجانية سخية**: 5GB + 1 مليار row reads شهرياً

## خطوات الإعداد:

### 1. إنشاء حساب PlanetScale
```bash
# زيارة https://planetscale.com
# إنشاء حساب جديد
# تأكيد البريد الإلكتروني
```

### 2. إنشاء قواعد البيانات

#### أ. قاعدة Production:
```bash
# اسم القاعدة: sabq-ai-prod
# المنطقة: اختر الأقرب لمستخدميك (مثلاً: eu-west أو us-east)
# النوع: Production branch
```

#### ب. قاعدة Staging:
```bash
# اسم القاعدة: sabq-ai-staging
# المنطقة: نفس منطقة Production
# النوع: Development branch
```

### 3. الحصول على بيانات الاتصال

من لوحة تحكم PlanetScale:
1. اختر القاعدة المطلوبة
2. اضغط على "Connect"
3. اختر "Prisma" من القائمة
4. انسخ connection string

### 4. إعداد ملف .env

```env
# Production Database
DATABASE_URL="mysql://[username]:[password]@[host]/sabq-ai-prod?sslaccept=strict"

# Staging Database
DATABASE_URL_STAGING="mysql://[username]:[password]@[host]/sabq-ai-staging?sslaccept=strict"

# Development Database (اختياري)
DATABASE_URL_DEV="mysql://[username]:[password]@[host]/sabq-ai-dev?sslaccept=strict"

# تحديد البيئة
APP_ENV="development" # أو "staging" أو "production"
```

### 5. تحديث Prisma Schema

في `prisma/schema.prisma`:
```prisma
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma" # مهم لـ PlanetScale
}
```

### 6. إعداد Branches في PlanetScale

#### أ. Production Branch:
- حماية من التعديلات المباشرة
- تفعيل automatic backups
- تفعيل query insights

#### ب. Development Branches:
```bash
# إنشاء branch جديد للتطوير
pscale branch create sabq-ai-prod feature-xyz

# الاتصال بالـ branch
pscale connect sabq-ai-prod feature-xyz --port 3309
```

### 7. تشغيل Migrations

#### للبيئة التطويرية:
```bash
# توليد migration
npx prisma migrate dev --name init

# تطبيق migration
npx prisma db push
```

#### لـ Production:
```bash
# استخدام PlanetScale deploy requests
pscale deploy-request create sabq-ai-prod feature-xyz

# مراجعة التغييرات
pscale deploy-request show sabq-ai-prod 1

# تطبيق التغييرات
pscale deploy-request deploy sabq-ai-prod 1
```

## أفضل الممارسات:

### 1. Connection String Security
```typescript
// استخدم دائماً SSL
?sslaccept=strict

// لا تضع معلومات الاتصال في الكود
// استخدم متغيرات البيئة فقط
```

### 2. إدارة Indexes
```prisma
model articles {
  // ... fields ...
  
  @@index([status, published_at]) // للاستعلامات الشائعة
  @@index([category_id])
  @@index([author_id])
}
```

### 3. Query Optimization
```typescript
// استخدم select للحقول المطلوبة فقط
const articles = await prisma.articles.findMany({
  select: {
    id: true,
    title: true,
    slug: true,
    // فقط الحقول المطلوبة
  }
})

// تجنب N+1 queries
const articlesWithCategory = await prisma.articles.findMany({
  include: {
    category: true // جلب العلاقات مرة واحدة
  }
})
```

### 4. Connection Pooling
PlanetScale يدير connection pooling تلقائياً، لكن يمكنك التحكم:
```typescript
// في حالات الحمل العالي
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '&connection_limit=100'
    }
  }
})
```

## المراقبة والصيانة:

### 1. Query Insights
- متوفر في لوحة تحكم PlanetScale
- يعرض الاستعلامات البطيئة
- اقتراحات لتحسين الأداء

### 2. Automatic Backups
- تلقائية كل 24 ساعة
- الاحتفاظ بها لمدة 30 يوم
- إمكانية الاستعادة لأي نقطة زمنية

### 3. Monitoring
```typescript
// إضافة health check
app.get('/api/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'healthy', database: 'connected' })
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message })
  }
})
```

## التكلفة المتوقعة:

### الخطة المجانية (Hobby):
- 5 GB storage
- 1 billion row reads/month
- 10 million row writes/month
- **مناسبة للبداية والتطوير**

### خطة Scaler ($29/شهر):
- 10 GB storage
- 100 billion row reads/month
- 50 million row writes/month
- **مناسبة عند نمو المستخدمين**

### خطة Team ($59/شهر):
- 50 GB storage
- غير محدود row reads
- غير محدود row writes
- **للمشاريع الكبيرة**

## نصائح للأداء الأمثل:

1. **استخدم الـ caching بذكاء** (Redis/Upstash)
2. **قلل عدد الاستعلامات** باستخدام includes
3. **استخدم pagination** للقوائم الطويلة
4. **راقب slow queries** من لوحة التحكم
5. **استخدم read replicas** عند الحاجة

## الخلاصة:
PlanetScale خيار ممتاز لمنصة سبق الذكية لأنه:
- ✅ يوفر أداء عالي جداً
- ✅ سهل الإدارة والصيانة
- ✅ يتوسع تلقائياً مع النمو
- ✅ آمن ومستقر
- ✅ تكلفة معقولة جداً 