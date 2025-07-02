# حل مشكلة خطأ react-hot-toast في Next.js 15.3.3

## تاريخ: 2025-01-25
## المطور: علي الحزمي

## وصف المشكلة:
```
Error: Cannot find module './vendor-chunks/react-hot-toast.js'
Require stack:
- /Users/alialhazmi/Projects/sabq-ai-cms/.next/server/webpack-runtime.js
- /Users/alialhazmi/Projects/sabq-ai-cms/.next/server/app/article/[id]/page.js
```

## السبب:
- مشكلة في build cache لـ Next.js
- تعارض في vendor chunks بعد التحديثات المتكررة
- احتمال وجود ملفات cache قديمة

## الحل المطبق:

### 1. تنظيف Cache:
```bash
# حذف مجلد .next
rm -rf .next

# حذف cache node_modules
rm -rf node_modules/.cache
```

### 2. التحقق من التثبيت:
```bash
# التحقق من وجود react-hot-toast
npm list react-hot-toast
# النتيجة: react-hot-toast@2.5.2 ✅

# إعادة تثبيت الحزم
npm install
```

### 3. تشغيل الخادم من جديد:
```bash
npm run dev
```

## إجراءات وقائية:

### 1. إضافة إعدادات webpack في next.config.ts:
```typescript
webpack: (config, { isServer }) => {
  // تعطيل cache في بيئة التطوير
  if (!isServer) {
    config.cache = false;
  }
  
  // إضافة fallback للملفات المفقودة
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    net: false,
    tls: false,
  };

  return config;
}
```

### 2. أوامر مفيدة عند تكرار المشكلة:
```bash
# تنظيف شامل
rm -rf .next node_modules/.cache
npm cache clean --force

# إعادة تثبيت كاملة (في الحالات الصعبة)
rm -rf node_modules package-lock.json
npm install
```

## النتيجة:
✅ تم حل المشكلة بنجاح
✅ الخادم يعمل على http://localhost:3000
✅ لا توجد أخطاء في vendor chunks

## ملاحظات:
- هذه المشكلة شائعة في Next.js 15 مع hot reload
- يُنصح بتنظيف cache بشكل دوري عند التطوير
- إذا تكررت المشكلة، قد تحتاج لإعادة تثبيت node_modules بالكامل 