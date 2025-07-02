# دليل إصلاح مشكلة البناء (Build) على السيرفر

## المشكلة
فشل بناء المشروع على السيرفر بسبب حزم مفقودة رغم وجودها في `package.json`.

## الحل

### 1. التأكد من تثبيت جميع الحزم على السيرفر
```bash
# على السيرفر، في مجلد المشروع
npm install

# أو إذا كنت تستخدم yarn
yarn install

# للتأكد من تثبيت الحزم بشكل صحيح
npm list @radix-ui/react-dialog
npm list @radix-ui/react-alert-dialog
```

### 2. حذف مجلد node_modules وإعادة التثبيت (إذا استمرت المشكلة)
```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. بناء المشروع
```bash
npm run build
```

## الحزم المطلوبة (موجودة في package.json)
- @radix-ui/react-dialog
- @radix-ui/react-alert-dialog
- @radix-ui/react-slot
- class-variance-authority
- react-hot-toast (بدلاً من react-toastify)

## ملاحظة
تم إصلاح خطأ استيراد `react-toastify` في `app/dashboard/news/create/page.tsx` - المشروع يستخدم `react-hot-toast` بدلاً منها. 