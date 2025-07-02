# ⚡ الحل السريع لمشكلة قاعدة البيانات

## 🎯 المشكلة
```
GET /api/categories 500 (Internal Server Error)
Invalid `prisma.category.findMany()` invocation
```

## 🚀 الحل السريع (5 دقائق)

### الخطوة 1: إعداد قاعدة البيانات على Vercel
1. اذهب إلى https://vercel.com/dashboard
2. اختر مشروع `sabq-ai-cms`
3. انقر تبويب **"Storage"**
4. انقر **"Create Database"**
5. اختر **"Postgres"**
6. اختر **"Hobby (Free)"**
7. أدخل اسم: `sabq-database`
8. انقر **"Create"**

### الخطوة 2: إعداد متغيرات البيئة
في نفس الصفحة، انقر **"Settings"** ثم **"Environment Variables"**:

```env
DATABASE_URL=$POSTGRES_PRISMA_URL
JWT_SECRET=sabq-secret-key-2024-ultra-secure
ADMIN_SECRET=admin-secret-2024
CLOUDINARY_CLOUD_NAME=dybhezmvb
CLOUDINARY_API_KEY=559894124915114
CLOUDINARY_API_SECRET=vuiA8rLNm7d1U-UAOTED6FyC4hY
```

### الخطوة 3: إعادة النشر
1. اذهب إلى تبويب **"Deployments"**
2. انقر **"..."** بجانب آخر deployment
3. اختر **"Redeploy"**
4. **أزل العلامة** من "Use existing Build Cache"
5. انقر **"Redeploy"**

### الخطوة 4: التحقق (بعد 2-3 دقائق)
```bash
# اختبار الفئات
curl https://sabq-ai-cms.vercel.app/api/categories

# اختبار الصحة العامة
curl https://sabq-ai-cms.vercel.app/api/health
```

## 🔍 إذا استمرت المشكلة

### تحقق من Logs
1. في Vercel Dashboard > Functions
2. انقر على أي function فاشلة
3. راجع الأخطاء

### تشغيل Migration يدوياً
```bash
curl -X POST https://sabq-ai-cms.vercel.app/api/admin/migrate-db \
  -H "Content-Type: application/json" \
  -d '{"secret":"admin-secret-2024"}'
```

## ✅ النتيجة المتوقعة
بعد هذه الخطوات، يجب أن تعمل جميع APIs:
- ✅ `/api/categories` - جلب الفئات
- ✅ `/api/articles` - جلب المقالات  
- ✅ `/api/upload` - رفع الصور
- ✅ `/dashboard` - لوحة التحكم

## 📱 اتصل بي إذا احتجت مساعدة!
هذا الحل يجب أن يعمل خلال 5 دقائق. إذا واجهت أي مشكلة، أرسل لي screenshot من الخطأ. 