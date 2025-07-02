#!/bin/bash

# سكريبت رفع التحديثات إلى السيرفر
echo "🚀 بدء رفع التحديثات إلى السيرفر..."

# 1. بناء المشروع محلياً
echo "📦 بناء المشروع..."
npm run build

# 2. إنشاء ملف مضغوط للملفات المحدثة
echo "🗜️ إنشاء ملف مضغوط..."
tar -czf deploy-update.tar.gz \
  .next \
  app \
  components \
  styles \
  lib \
  types \
  public \
  package.json \
  package-lock.json \
  prisma \
  next.config.js \
  tailwind.config.js \
  postcss.config.js

echo "✅ تم إنشاء ملف deploy-update.tar.gz"
echo ""
echo "📋 الخطوات التالية:"
echo "1. ارفع الملف deploy-update.tar.gz إلى السيرفر عبر cPanel File Manager"
echo "2. فك الضغط في مجلد المشروع"
echo "3. شغل الأوامر التالية في Terminal:"
echo "   npm install --production"
echo "   npx prisma generate"
echo "   npx prisma db push"
echo "   pm2 restart all" 