#!/bin/bash

# سكريبت إعداد البيئة لمشروع سبق
# يقوم بنسخ الإعدادات الصحيحة لقاعدة البيانات البعيدة وCloudinary

echo "🚀 إعداد البيئة لمشروع سبق..."

# إنشاء ملف .env.local بالإعدادات الصحيحة
cat > .env.local << 'EOF'
# قاعدة البيانات البعيدة - DigitalOcean PostgreSQL
DATABASE_URL='postgresql://doadmin:[YOUR_PASSWORD]@db-sabq-ai-1755-do-user-23559731-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require'

# إعدادات Cloudinary للصور
CLOUDINARY_CLOUD_NAME=dybhezmvb
CLOUDINARY_API_KEY=559894124915114
CLOUDINARY_API_SECRET=[YOUR_CLOUDINARY_SECRET]
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dybhezmvb
NEXT_PUBLIC_CLOUDINARY_API_KEY=559894124915114

# إعدادات الموقع
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="صحيفة سبق الإلكترونية"

# المصادقة والأمان
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this
API_SECRET_KEY=X9yZ1aC3eF5gH7jK9mN2pQ4rS6tV8wX0yZ1aC3eF5gH7j

# البريد الإلكتروني (اختياري)
SMTP_HOST=mail.jur3a.ai
SMTP_PORT=465
SMTP_USER=noreplay@jur3a.ai
SMTP_PASS=[YOUR_EMAIL_PASSWORD]
SMTP_SECURE=true
EMAIL_FROM_NAME=سبق
EMAIL_FROM_ADDRESS=noreply@sabq.org

# ميزات النظام
ENABLE_AI_FEATURES=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_LOYALTY_SYSTEM=true
ENABLE_COMMENTS=true
ENABLE_DB_PROTECTION=true

# بيئة التطوير
NODE_ENV=development
SKIP_EMAIL_VERIFICATION=true
DEBUG_MODE=false
EOF

echo "✅ تم إنشاء ملف .env.local بالإعدادات الصحيحة"
echo ""
echo "⚠️  تنبيه: يجب عليك تحديث المعلومات التالية في .env.local:"
echo "   1. استبدل [YOUR_PASSWORD] بكلمة مرور قاعدة البيانات الخاصة بك"
echo "   2. استبدل [YOUR_CLOUDINARY_SECRET] بمفتاح Cloudinary السري"
echo "   3. استبدل [YOUR_EMAIL_PASSWORD] بكلمة مرور البريد الإلكتروني (اختياري)"
echo ""

# نسخ احتياطية
cp .env.local .env.local.backup
echo "✅ تم إنشاء نسخة احتياطية في .env.local.backup"

echo "🎉 تم إعداد البيئة بنجاح!"
echo ""
echo "يمكنك الآن تشغيل المشروع باستخدام:"
echo "./start-sabq.sh" 