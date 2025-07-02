#!/bin/bash

echo "🔧 إصلاح CSS على السيرفر..."

# التأكد من وجود postcss.config.js
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

# حذف مجلد البناء القديم
echo "🗑️  حذف ملفات البناء القديمة..."
rm -rf .next

# بناء المشروع
echo "🏗️  بناء المشروع..."
npm run build

# إعادة تشغيل PM2
echo "🔄 إعادة تشغيل التطبيق..."
pm2 restart sabq-cms

echo "✅ تم إصلاح CSS بنجاح!" 