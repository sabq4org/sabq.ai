#!/bin/bash

echo "🧹 بدء عملية التنظيف الشامل..."

# إيقاف جميع عمليات Node.js
echo "⏹️ إيقاف عمليات Node.js..."
pkill -f "next dev" || true
pkill -f "node" || true

# حذف جميع ملفات cache
echo "🗑️ حذف ملفات cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf .swc

# حذف node_modules وإعادة تثبيت
echo "📦 إعادة تثبيت node_modules..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# تنظيف npm cache
echo "🧽 تنظيف npm cache..."
npm cache clean --force

# إعادة تثبيت dependencies
echo "⬇️ تثبيت dependencies..."
npm install

# توليد Prisma
echo "🔧 توليد Prisma client..."
npx prisma generate

# إنشاء مجلد .next
echo "📁 إنشاء مجلد .next..."
mkdir -p .next

echo "✅ تم التنظيف بنجاح!"
echo "🚀 يمكنك الآن تشغيل: npm run dev" 