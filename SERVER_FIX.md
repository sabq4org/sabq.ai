# حل سريع لمشكلة البناء على السيرفر

## الأوامر المطلوبة:

```bash
# 1. سحب التحديثات
git pull

# 2. حذف مجلد .next القديم
rm -rf .next

# 3. إنشاء postcss.config.js
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# 4. البناء بدون تتبع
NEXT_TELEMETRY_DISABLED=1 npm run build

# 5. إعادة تشغيل PM2
pm2 restart sabq-cms
```

## أو استخدم الأمر الجديد:

```bash
git pull
npm run build:force
pm2 restart sabq-cms
```

## أو استخدم السكريبت:

```bash
git pull
./scripts/force-fix-build.sh
``` 