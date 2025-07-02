#!/bin/bash

# سكريبت إعداد البيئة لمشروع سبق
# يقوم بنسخ الإعدادات الصحيحة لقاعدة البيانات البعيدة وCloudinary

echo "🚀 إعداد البيئة لمشروع سبق..."

# إنشاء ملف .env.local بالإعدادات الصحيحة
cat > .env.local << 'EOF'
# قاعدة البيانات البعيدة - PlanetScale
DATABASE_URL='mysql://username:password@host/database?sslaccept=strict'

# إعدادات Cloudinary للصور
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# إعدادات الموقع
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="صحيفة سبق الإلكترونية"

# المصادقة والأمان
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this

# ميزات النظام
ENABLE_AI_FEATURES=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_LOYALTY_SYSTEM=true
ENABLE_COMMENTS=true

# بيئة التطوير
NODE_ENV=development
SKIP_EMAIL_VERIFICATION=true
DEBUG_MODE=false
EOF

echo "✅ تم إنشاء ملف .env.local بالإعدادات الصحيحة"

# نسخ احتياطية
cp .env.local .env.local.backup
echo "✅ تم إنشاء نسخة احتياطية في .env.local.backup"

echo "🎉 تم إعداد البيئة بنجاح!"
echo ""
echo "يمكنك الآن تشغيل المشروع باستخدام:"
echo "npm run dev" 