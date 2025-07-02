# حل مشكلة Service Unavailable (503)

## المشكلة
بعد إضافة `prisma generate` إلى `postinstall`، توقف الموقع عن العمل مع خطأ 503.

## السبب
إضافة `prisma generate` في `postinstall` قد يسبب مشاكل في بيئات الإنتاج المحدودة.

## الحل

### طريقة 1: استخدام السكريبت الجديد
```bash
cd ~/sabq-ai-cms
git pull
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

### طريقة 2: الخطوات اليدوية
```bash
cd ~/sabq-ai-cms
git pull
npm install --omit=dev
npx prisma generate
npm run build
pm2 restart all
```

## ملاحظات مهمة
- تم إزالة `prisma generate` من `postinstall`
- يجب تشغيل `prisma generate` يدوياً بعد `npm install`
- السكريبت `setup-production.sh` يتولى كل الخطوات تلقائياً 