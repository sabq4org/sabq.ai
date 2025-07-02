#!/bin/bash

echo "🔧 إصلاح صلاحيات المشروع..."

# حذف مجلد .next القديم
echo "🗑️  حذف مجلد .next القديم..."
sudo rm -rf .next

# إنشاء مجلد .next جديد بالصلاحيات الصحيحة
echo "📁 إنشاء مجلد .next جديد..."
mkdir -p .next
chmod 755 .next

# إعطاء صلاحيات للمستخدم الحالي
echo "🔐 تعيين الصلاحيات..."
sudo chown -R $(whoami):$(whoami) .
chmod -R 755 .

# التأكد من صلاحيات node_modules
echo "📦 إصلاح صلاحيات node_modules..."
chmod -R 755 node_modules 2>/dev/null || true

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

echo "✅ تم إصلاح الصلاحيات!"
echo "🏗️  الآن يمكنك تشغيل: npm run build" 