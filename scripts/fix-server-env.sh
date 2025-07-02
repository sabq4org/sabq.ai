#!/bin/bash

echo "🔧 إصلاح ملف .env على الخادم"
echo "============================="

# إنشاء ملف .env مع القيم الصحيحة
cat > .env << 'EOF'
# قاعدة البيانات PlanetScale للإنتاج
# استبدل هذه القيم بقيم قاعدة بياناتك الحقيقية
DATABASE_URL="mysql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST/YOUR_DATABASE?ssl=true"

# مفتاح JWT - استخدم مفتاح قوي وطويل
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# URL الأساسي
NEXT_PUBLIC_BASE_URL="https://jur3a.ai"

# إعدادات البريد الإلكتروني (اختياري)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER=""
EMAIL_PASSWORD=""
EMAIL_FROM="noreply@jur3a.ai"

# بيئة الإنتاج
NODE_ENV="production"
PORT="3000"
EOF

echo "✅ تم إنشاء ملف .env نموذجي"
echo ""
echo "⚠️  مهم جداً:"
echo "============"
echo "1. عدّل DATABASE_URL في ملف .env بقيم قاعدة بياناتك الحقيقية"
echo "2. عدّل JWT_SECRET بمفتاح قوي وعشوائي"
echo ""
echo "📝 للحصول على بيانات PlanetScale:"
echo "1. اذهب إلى https://app.planetscale.com"
echo "2. اختر قاعدة بياناتك"
echo "3. اذهب إلى Settings > Passwords"
echo "4. أنشئ كلمة مرور جديدة أو استخدم الموجودة"
echo "5. انسخ connection string"
echo ""
echo "مثال على DATABASE_URL الصحيح:"
echo 'DATABASE_URL="mysql://username:***REMOVED***xxxxx@aws.connect.psdb.cloud/database-name?ssl={"rejectUnauthorized":true}"' 