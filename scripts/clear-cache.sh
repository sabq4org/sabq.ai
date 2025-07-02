#!/bin/bash

echo "🧹 تنظيف كاش Next.js..."

# حذف مجلد .next
if [ -d ".next" ]; then
    echo "حذف مجلد .next..."
    rm -rf .next
fi

# حذف كاش node_modules إذا لزم الأمر
if [ -d "node_modules/.cache" ]; then
    echo "حذف كاش node_modules..."
    rm -rf node_modules/.cache
fi

# حذف ملفات الكاش الأخرى
echo "حذف ملفات الكاش الأخرى..."
rm -rf .turbo
rm -rf .swc

# تنظيف كاش npm
echo "تنظيف كاش npm..."
npm cache clean --force

echo "✅ تم تنظيف الكاش بنجاح!"
echo ""
echo "يمكنك الآن تشغيل المشروع بـ: npm run dev" 