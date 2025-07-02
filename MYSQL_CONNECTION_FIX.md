# 🔧 حل مشكلة رابط MySQL مع Prisma

## 🎯 المشكلة المحددة
- المشروع مُعد لـ MySQL ✅
- قاعدة البيانات MySQL موجودة ✅  
- المشكلة: تنسيق رابط الاتصال غير متوافق مع Prisma

## 📊 التشخيص الحالي
```json
{
  "database_url_preview": "mysql://5k3qivqt4ihe...",
  "error": "the URL must start with the protocol `prisma://` or `prisma+postgres://`"
}
```

## 🚀 الحل الفوري

### الخطوة 1: تحديث رابط الاتصال
في Vercel Dashboard > Settings > Environment Variables:

**بدلاً من:**
```env
DATABASE_URL=mysql://5k3qivqt4ihe...
```

**استخدم:**
```env
DATABASE_URL=mysql://5k3qivqt4ihe...?sslaccept=strict&connect_timeout=60
```

أو إذا كان لديك رابط PlanetScale:
```env
DATABASE_URL=mysql://username:password@host/database?sslaccept=strict
```

### الخطوة 2: إضافة متغيرات إضافية (اختياري)
```env
DATABASE_URL=mysql://5k3qivqt4ihe...?sslaccept=strict
DIRECT_URL=mysql://5k3qivqt4ihe...?sslaccept=strict
```

### الخطوة 3: تحديث Prisma Schema (إذا لزم الأمر)
تأكد من أن `prisma/schema.prisma` يحتوي على:
```prisma
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  directUrl    = env("DIRECT_URL")  // اختياري
  relationMode = "prisma"
}
```

## 🔄 إعادة النشر
1. في Vercel Dashboard > Deployments
2. انقر "Redeploy" على آخر deployment
3. أزل العلامة من "Use existing Build Cache"
4. انقر "Redeploy"

## 🧪 اختبار النتيجة
```bash
# بعد 2-3 دقائق
curl https://sabq-ai-cms.vercel.app/api/test-db
curl https://sabq-ai-cms.vercel.app/api/categories
```

## 🆘 إذا لم يعمل الحل

### البديل: استخدام PlanetScale
1. اذهب إلى https://planetscale.com
2. أنشئ حساب مجاني
3. أنشئ قاعدة بيانات جديدة
4. احصل على connection string
5. استخدمه في `DATABASE_URL`

### أو: التبديل إلى PostgreSQL
1. أنشئ قاعدة Postgres في Vercel Storage
2. حدث `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. أعد generate Prisma client

## 📞 الحالة المتوقعة
بعد التطبيق، يجب أن ترى:
```json
{
  "success": true,
  "message": "تم الاتصال بقاعدة البيانات بنجاح",
  "database": {
    "connected": true,
    "tables": {
      "categories": 0,
      "articles": 0,
      "users": 0
    }
  }
}
``` 