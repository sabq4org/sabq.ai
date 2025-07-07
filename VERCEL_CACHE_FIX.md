# حل مشكلة Vercel Cache القديم

## المشكلة
Vercel يحاول بناء ملف غير موجود:
```
app/api/admin/users/[userId]/reset-password/route.ts
```

هذا الملف كان موجود في commit قديم (`06fc489`) ولكن تم حذفه في commits لاحقة.

## الحل السريع في Vercel Dashboard

### 1. افتح Vercel Dashboard
- اذهب إلى: https://vercel.com/dashboard
- اختر مشروع `sabqai`

### 2. اذهب إلى Settings → Functions
- ابحث عن "Clear Build Cache"
- اضغط على "Clear Cache"

### 3. أعد Deploy يدوياً
- اذهب إلى Deployments
- اضغط على النقاط الثلاث (...) بجانب آخر deployment
- اختر "Redeploy"
- **مهم**: اختر "Use existing Build Cache" = **NO**

### 4. طريقة بديلة - Force Deploy
في Terminal:
```bash
# Install Vercel CLI إذا لم يكن مثبت
npm i -g vercel

# Login
vercel login

# Force deploy with no cache
vercel --prod --force
```

## إذا لم تنجح الطرق السابقة

### حل جذري - إعادة ربط المشروع:
1. في Vercel Dashboard → Settings → Git
2. اضغط "Disconnect from Git"
3. احذف المشروع من Vercel
4. أنشئ مشروع جديد وأربطه بنفس GitHub repo

## التحقق من نجاح الحل
بعد إعادة البناء، يجب أن ترى في logs:
- "Checking out commit" مع hash آخر commit (`6d4e65d` أو أحدث)
- لا يجب أن تظهر أي أخطاء عن `reset-password/route.ts`

## ملاحظات مهمة
- الملف المسبب للخطأ **غير موجود** في الكود الحالي
- المشكلة 100% من Vercel cache
- آخر commit نظيف وخالي من الأخطاء

---
تم التوثيق: 2025-01-07 