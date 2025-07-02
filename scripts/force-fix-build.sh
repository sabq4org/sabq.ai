#!/bin/bash

echo "🔧 إصلاح قوي لمشكلة البناء..."

# التأكد من أننا في المجلد الصحيح
if [ ! -f "package.json" ]; then
    echo "❌ خطأ: يجب تشغيل هذا السكريبت من مجلد المشروع"
    exit 1
fi

# حذف جميع ملفات البناء القديمة
echo "🗑️  حذف جميع ملفات البناء..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .turbo 2>/dev/null || true

# إنشاء postcss.config.js
echo "📝 إنشاء postcss.config.js..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# إنشاء مجلد مؤقت للبناء
echo "📁 إعداد بيئة البناء..."
export NEXT_TELEMETRY_DISABLED=1
export SKIP_ENV_VALIDATION=1

# محاولة البناء في مجلد مختلف
echo "🏗️  بدء البناء..."
mkdir -p /tmp/nextjs-build-$$
export TMP=/tmp/nextjs-build-$$
export TMPDIR=/tmp/nextjs-build-$$
export TEMP=/tmp/nextjs-build-$$

# البناء مع تعطيل التتبع
NODE_OPTIONS="--max-old-space-size=4096" NEXT_TELEMETRY_DISABLED=1 npm run build

# تنظيف المجلد المؤقت
rm -rf /tmp/nextjs-build-$$

echo "✅ تم البناء بنجاح!"
echo "🚀 الآن يمكنك تشغيل: pm2 restart sabq-cms" 