#!/bin/bash

echo "🔧 إصلاح مشكلة البناء..."

# حذف مجلد .next القديم
echo "🗑️  حذف مجلد .next القديم..."
rm -rf .next 2>/dev/null || true

# إنشاء مجلد .next جديد
echo "📁 إنشاء مجلد .next جديد..."
mkdir -p .next
chmod 755 .next

# إنشاء postcss.config.js إذا لم يكن موجوداً
if [ ! -f "postcss.config.js" ]; then
  echo "📝 إنشاء postcss.config.js..."
  cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
fi

# حذف cache
echo "🧹 تنظيف الـ cache..."
rm -rf node_modules/.cache 2>/dev/null || true

# محاولة البناء مع متغيرات بيئة خاصة
echo "🏗️  بدء البناء..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "✅ انتهى!" 