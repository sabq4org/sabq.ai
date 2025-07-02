# تقرير حل مشكلة tailwind-merge و Webpack
📅 التاريخ: 2025-01-29

## ❌ المشكلة

عند زيارة صفحة المقال، كان يظهر خطأ:
```
Error: Cannot find module './vendor-chunks/tailwind-merge.js'
Require stack:
- /Users/alialhazmi/Projects/sabq-ai-cms/.next/server/webpack-runtime.js
- /Users/alialhazmi/Projects/sabq-ai-cms/.next/server/app/article/[id]/page.js
```

## 🔍 السبب

المشكلة كانت في ملفات البناء (.next) المعطوبة أو القديمة، مما سبب فشل في تحميل حزمة tailwind-merge بشكل صحيح.

## ✅ الحل

### 1. إيقاف جميع عمليات Next.js
```bash
pkill -f "next dev"
```

### 2. حذف ملفات البناء والكاش
```bash
rm -rf .next node_modules/.cache
```

### 3. إعادة تثبيت tailwind-merge
```bash
npm uninstall tailwind-merge
npm install tailwind-merge
```

### 4. إعادة تشغيل السيرفر
```bash
npm run dev
```

## 📋 التحقق من الملفات المهمة

### lib/utils.ts
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

✅ الملف صحيح ويستورد twMerge بشكل صحيح.

## 🎯 النتيجة

- ✅ صفحة المقال تعمل بدون أخطاء
- ✅ صفحة التعديل تعمل بالتصميم الجديد
- ✅ جميع الصفحات تعمل بشكل طبيعي

## 💡 نصائح لتجنب المشكلة مستقبلاً

1. **عند ظهور أخطاء Webpack**:
   - احذف مجلد `.next`
   - أعد تشغيل السيرفر

2. **عند تحديث الحزم**:
   - احذف `node_modules/.cache`
   - أعد البناء من جديد

3. **في بيئة الإنتاج**:
   - استخدم `npm run build` بدلاً من dev mode
   - تأكد من وجود جميع الحزم في `dependencies`

## 🚀 الأوامر المفيدة

```bash
# مسح كامل وإعادة بناء
rm -rf .next node_modules/.cache
npm run dev

# التحقق من وجود حزمة
npm list tailwind-merge

# إعادة تثبيت جميع الحزم
rm -rf node_modules package-lock.json
npm install
```