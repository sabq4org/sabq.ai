# إصلاح مشكلة CSS على السيرفر

## المشكلة
واجهة المستخدم غير منسقة بسبب عدم وجود ملف `postcss.config.js` المطلوب لمعالجة Tailwind CSS.

## إذا واجهت خطأ EACCES (مشكلة صلاحيات)

### الحل 1: مع صلاحيات sudo
```bash
./scripts/fix-permissions-server.sh
```

### الحل 2: بدون sudo
```bash
./scripts/fix-build-permissions.sh
```

### أو يدوياً:
```bash
# حذف مجلد .next
rm -rf .next

# إنشاء postcss.config.js
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# البناء
npm run build
```

## الحل السريع (بعد إصلاح الصلاحيات)

1. **ادخل إلى السيرفر عبر SSH**
2. **انتقل إلى مجلد المشروع**
3. **شغل السكريبت التالي**:

```bash
./scripts/fix-css-production.sh
```

## أو يدوياً:

```bash
# 1. إنشاء postcss.config.js
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# 2. حذف مجلد البناء القديم
rm -rf .next

# 3. إعادة البناء
npm run build

# 4. إعادة تشغيل التطبيق
pm2 restart sabq-cms
```

## التحقق من النتيجة
- افتح الموقع وتأكد من أن التنسيقات تعمل بشكل صحيح
- تأكد من عمل الوضع الليلي
- تأكد من عمل جميع الأنماط والألوان

## ملاحظات
- السكريبت `fix-css-production.sh` يقوم بكل الخطوات تلقائياً
- البناء قد يستغرق 2-3 دقائق
- تأكد من أن PM2 يعمل بشكل صحيح بعد إعادة التشغيل 