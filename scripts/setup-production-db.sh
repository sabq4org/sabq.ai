#!/bin/bash

echo "🚀 إعداد قاعدة البيانات للإنتاج"
echo "================================"

# التحقق من تثبيت PlanetScale CLI
if ! command -v pscale &> /dev/null; then
    echo "❌ PlanetScale CLI غير مثبت. يرجى تثبيته أولاً:"
    echo "brew install planetscale/tap/pscale"
    exit 1
fi

# التحقق من تسجيل الدخول
if ! pscale auth whoami &> /dev/null; then
    echo "❌ يرجى تسجيل الدخول في PlanetScale أولاً:"
    echo "pscale auth login"
    exit 1
fi

# متغيرات
DB_NAME="jur3a-production"
REGION="us-east-1"  # يمكن تغييرها حسب الموقع
BRANCH="main"

echo "📦 إنشاء قاعدة بيانات الإنتاج..."
pscale database create $DB_NAME --region $REGION 2>/dev/null || echo "✅ قاعدة البيانات موجودة بالفعل"

echo "🔑 إنشاء كلمة مرور للإنتاج..."
PASSWORD_OUTPUT=$(pscale password create $DB_NAME $BRANCH production-password --format json 2>/dev/null)

if [ $? -eq 0 ]; then
    # استخراج معلومات الاتصال
    USERNAME=$(echo $PASSWORD_OUTPUT | jq -r '.username')
    PASSWORD=$(echo $PASSWORD_OUTPUT | jq -r '.password')
    HOST=$(echo $PASSWORD_OUTPUT | jq -r '.hostname')
    
    # إنشاء DATABASE_URL
    DATABASE_URL="mysql://${USERNAME}:${PASSWORD}@${HOST}/${DB_NAME}?ssl=true&sslaccept=strict"
    
    echo ""
    echo "✅ تم إنشاء بيانات الاتصال بنجاح!"
    echo ""
    echo "📋 أضف هذا إلى ملف .env.production:"
    echo "DATABASE_URL=\"$DATABASE_URL\""
    echo ""
    
    # حفظ في ملف مؤقت
    echo "DATABASE_URL=\"$DATABASE_URL\"" > .env.production.temp
    echo "💾 تم حفظ DATABASE_URL في .env.production.temp"
else
    echo "⚠️  فشل إنشاء كلمة المرور. قد تكون موجودة بالفعل."
    echo "يمكنك الحصول على بيانات الاتصال من:"
    echo "https://app.planetscale.com/${DB_NAME}/settings/passwords"
fi

echo ""
echo "📌 الخطوات التالية:"
echo "1. انسخ DATABASE_URL إلى ملف .env.production"
echo "2. شغل: npm run build"
echo "3. شغل: NODE_ENV=production npx prisma db push"
echo "4. انشر التطبيق على الخادم" 