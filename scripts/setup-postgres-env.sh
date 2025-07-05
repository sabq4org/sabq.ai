#!/bin/bash

# سكريبت تفاعلي لإعداد بيئة PostgreSQL
echo "🚀 إعداد بيئة PostgreSQL لمشروع سبق"
echo "===================================="

# قراءة كلمة مرور قاعدة البيانات
echo ""
echo "📝 أدخل كلمة مرور قاعدة البيانات PostgreSQL:"
echo "   (يمكنك العثور عليها في لوحة تحكم DigitalOcean)"
read -s DB_PASSWORD

# قراءة Cloudinary Secret (اختياري)
echo ""
echo "📝 أدخل Cloudinary API Secret (اختياري - اضغط Enter للتخطي):"
read -s CLOUDINARY_SECRET

# قراءة كلمة مرور البريد الإلكتروني (اختياري)
echo ""
echo "📝 أدخل كلمة مرور البريد الإلكتروني (اختياري - اضغط Enter للتخطي):"
read -s EMAIL_PASSWORD

# إنشاء ملف .env.local
echo ""
echo "📄 إنشاء ملف .env.local..."

cat > .env.local << EOF
# قاعدة البيانات البعيدة - DigitalOcean PostgreSQL
DATABASE_URL='postgresql://doadmin:${DB_PASSWORD}@db-sabq-ai-1755-do-user-23559731-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require'

# إعدادات Cloudinary للصور
CLOUDINARY_CLOUD_NAME=dybhezmvb
CLOUDINARY_API_KEY=559894124915114
CLOUDINARY_API_SECRET=${CLOUDINARY_SECRET:-your_cloudinary_secret}
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
SMTP_PASS=${EMAIL_PASSWORD:-your_email_password}
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

echo "✅ تم إنشاء ملف .env.local بنجاح!"

# اختبار الاتصال
echo ""
echo "🔍 اختبار الاتصال بقاعدة البيانات..."
node scripts/test-postgres-connection-safe.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 تم إعداد البيئة بنجاح!"
    echo "يمكنك الآن تشغيل المشروع باستخدام:"
    echo "./start-sabq.sh"
else
    echo ""
    echo "❌ فشل الاتصال بقاعدة البيانات"
    echo "تأكد من:"
    echo "1. كلمة المرور صحيحة"
    echo "2. IP الخاص بك مضاف في Trusted Sources"
fi 