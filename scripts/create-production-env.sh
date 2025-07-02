#!/bin/bash

echo "🔧 إنشاء ملف .env للإنتاج"
echo "========================="

# إنشاء ملف .env نموذجي
cat > .env.example << 'EOF'
# قاعدة البيانات - PlanetScale
DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE?ssl=true"

# أو لقاعدة بيانات MySQL محلية
# DATABASE_URL="mysql://root:password@localhost:3306/sabq_cms"

# مفتاح JWT للمصادقة
JWT_SECRET="your-super-secret-jwt-key-here"

# URL الأساسي للموقع
NEXT_PUBLIC_BASE_URL="https://jur3a.ai"

# إعدادات البريد الإلكتروني
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="noreply@jur3a.ai"

# إعدادات رفع الملفات
NEXT_PUBLIC_UPLOAD_URL="/uploads"
MAX_FILE_SIZE="5242880"

# وضع التطوير
NODE_ENV="production"

# منفذ التطبيق
PORT="3000"
EOF

echo "✅ تم إنشاء ملف .env.example"
echo ""
echo "📝 الخطوات التالية:"
echo "1. انسخ الملف: cp .env.example .env"
echo "2. عدّل القيم في ملف .env حسب بيئتك"
echo "3. تأكد من إضافة .env إلى .gitignore"
echo ""
echo "⚠️  تنبيهات مهمة:"
echo "- لا تشارك ملف .env مع أحد"
echo "- استخدم كلمات مرور قوية"
echo "- تأكد من صحة بيانات قاعدة البيانات"

# إنشاء سكريبت للتحقق من المتغيرات
cat > check-env.js << 'EOF'
const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_BASE_URL'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
    console.error('❌ المتغيرات التالية مفقودة:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
} else {
    console.log('✅ جميع المتغيرات المطلوبة موجودة');
    
    // التحقق من صحة DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl.includes('USERNAME') || dbUrl.includes('PASSWORD')) {
        console.warn('⚠️  تحذير: DATABASE_URL يحتوي على قيم نموذجية');
    }
    
    // التحقق من JWT_SECRET
    if (process.env.JWT_SECRET.length < 32) {
        console.warn('⚠️  تحذير: JWT_SECRET قصير جداً (يُنصح بـ 32 حرف على الأقل)');
    }
}
EOF

echo ""
echo "🔍 للتحقق من المتغيرات، شغّل:"
echo "   node check-env.js" 