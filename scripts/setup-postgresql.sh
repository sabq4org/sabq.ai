#!/bin/bash

echo "🚀 إعداد PostgreSQL لمشروع سبق..."

# التحقق من وجود ملف .env.local
if [ ! -f .env.local ]; then
    echo "📝 إنشاء ملف .env.local..."
    cp env.example .env.local
    # echo "⚠️  تذكير: قم بتحديث DATABASE_URL في .env.local"
fi

# حذف ملفات Prisma القديمة
echo "🧹 تنظيف ملفات Prisma القديمة..."
rm -rf node_modules/.prisma
rm -rf lib/generated/prisma
rm -rf prisma/migrations

# توليد Prisma Client
echo "🔧 توليد Prisma Client..."
npx prisma generate

# عرض معلومات الاتصال
echo ""
echo "📋 معلومات قاعدة البيانات المطلوبة:"
echo "=================================="
echo "Provider: PostgreSQL"
echo "Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
echo ""
echo "مثال DigitalOcean:"
echo "postgresql://doadmin:AVNS_xxxxx@db-name.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
echo ""

# التحقق من الاتصال
echo "🔍 هل تريد اختبار الاتصال بقاعدة البيانات؟ (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "🔗 اختبار الاتصال..."
    npx prisma db pull --print
fi

echo ""
echo "✅ تم الإعداد! الخطوات التالية:"
# echo "1. تأكد من تحديث DATABASE_URL في .env.local"
echo "2. شغل: npx prisma migrate dev --name init"
echo "3. أو للإنتاج: npx prisma migrate deploy" 