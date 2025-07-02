#!/bin/bash
# سكريبت إعداد البيئة - منصة سبق الذكية

echo "🚀 بدء إعداد البيئة..."

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيت Node.js أولاً."
    exit 1
fi

# إنشاء ملف .env.local إذا لم يكن موجوداً
if [ ! -f .env.local ]; then
    echo "📝 إنشاء ملف .env.local..."
    cat > .env.local << 'EOF'
# ==============================================
# منصة سبق الذكية - متغيرات البيئة
# ==============================================

# قاعدة البيانات (PlanetScale)
DATABASE_URL="mysql://YOUR_DATABASE_CONNECTION_STRING"

# تكوين الموقع
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="صحيفة سبق الإلكترونية"

# المصادقة
JWT_SECRET=your-super-secret-jwt-key-$(openssl rand -hex 32)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-$(openssl rand -hex 32)

# التخزين السحابي
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# البريد الإلكتروني
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# ميزات النظام
ENABLE_AI_FEATURES=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_LOYALTY_SYSTEM=true
ENABLE_COMMENTS=true

# بيئة التطوير
NODE_ENV=development
SKIP_EMAIL_VERIFICATION=true
DEBUG_MODE=true

# حدود النظام
MAX_UPLOAD_SIZE=5242880
MAX_ARTICLES_PER_PAGE=20
SESSION_TIMEOUT=86400
EOF
    echo "✅ تم إنشاء .env.local"
    echo "⚠️  تذكير: يجب تحديث DATABASE_URL بقيمة الاتصال الصحيحة"
else
    echo "📋 .env.local موجود بالفعل"
fi

# تثبيت المكتبات
echo "📦 تثبيت المكتبات..."
npm install

# توليد Prisma Client
echo "🔧 توليد Prisma Client..."
npm run prisma:generate

# اختبار الاتصال بقاعدة البيانات
echo "🔍 اختبار الاتصال بقاعدة البيانات..."
node -e "
const { PrismaClient } = require('./lib/generated/prisma');
const prisma = new PrismaClient();

prisma.\$connect()
  .then(() => {
    console.log('✅ اتصال قاعدة البيانات ناجح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل اتصال قاعدة البيانات:', error.message);
    process.exit(1);
  });
"

echo ""
echo "✨ إعداد البيئة مكتمل!"
echo ""
echo "🎯 الخطوات التالية:"
echo "1. قم بتحديث قيم المتغيرات في .env.local"
echo "2. شغل التطبيق: npm run dev"
echo "3. افتح المتصفح على: http://localhost:3000"
echo ""
echo "📚 للمزيد من المعلومات، راجع: UNIFIED_ENVIRONMENT_GUIDE.md" 