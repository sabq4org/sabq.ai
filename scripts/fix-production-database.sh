#!/bin/bash

echo "🔧 سكريبت إصلاح قاعدة البيانات في الإنتاج"
echo "========================================="

# الانتقال لمجلد التطبيق
APP_DIR="/home/j3uar/sabq-ai-cms"  # غير هذا للمسار الصحيح
cd $APP_DIR || exit 1

echo "📁 المجلد الحالي: $(pwd)"

# 1. التحقق من وجود ملف .env
echo -e "\n1️⃣ التحقق من ملف البيئة..."
if [ -f .env ]; then
    echo "✅ ملف .env موجود"
    
    # التحقق من DATABASE_URL
    if grep -q "DATABASE_URL" .env; then
        echo "✅ DATABASE_URL موجود"
        # عرض جزء من DATABASE_URL للتحقق (بدون كلمة المرور)
        DATABASE_URL=$(grep DATABASE_URL .env | cut -d'=' -f2 | sed 's/:[^:]*@/:****@/')
        echo "   DATABASE_URL: $DATABASE_URL"
    else
        echo "❌ DATABASE_URL غير موجود!"
        echo "   يجب إضافة DATABASE_URL في ملف .env"
        exit 1
    fi
else
    echo "❌ ملف .env غير موجود!"
    echo "   يجب إنشاء ملف .env مع المتغيرات المطلوبة"
    exit 1
fi

# 2. التحقق من Prisma
echo -e "\n2️⃣ التحقق من Prisma..."
if [ -f "prisma/schema.prisma" ]; then
    echo "✅ ملف Prisma schema موجود"
else
    echo "❌ ملف Prisma schema غير موجود!"
    exit 1
fi

# 3. توليد Prisma Client
echo -e "\n3️⃣ توليد Prisma Client..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo "✅ تم توليد Prisma Client بنجاح"
else
    echo "❌ فشل توليد Prisma Client"
    exit 1
fi

# 4. اختبار الاتصال بقاعدة البيانات
echo -e "\n4️⃣ اختبار الاتصال بقاعدة البيانات..."
cat > test-db-connection.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
    try {
        await prisma.$connect();
        console.log('✅ الاتصال بقاعدة البيانات نجح');
        
        // اختبار عد التصنيفات
        const categoriesCount = await prisma.category.count();
        console.log(`   عدد التصنيفات: ${categoriesCount}`);
        
        // اختبار عد المقالات
        const articlesCount = await prisma.article.count();
        console.log(`   عدد المقالات: ${articlesCount}`);
        
        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
        process.exit(1);
    }
}

testConnection();
EOF

node test-db-connection.js
DB_TEST_RESULT=$?
rm test-db-connection.js

if [ $DB_TEST_RESULT -ne 0 ]; then
    echo -e "\n⚠️  فشل اختبار قاعدة البيانات"
    echo "تحقق من:"
    echo "1. DATABASE_URL صحيح"
    echo "2. قاعدة البيانات تعمل"
    echo "3. بيانات الاتصال صحيحة"
    exit 1
fi

# 5. مزامنة قاعدة البيانات
echo -e "\n5️⃣ مزامنة قاعدة البيانات..."
read -p "هل تريد تشغيل prisma db push؟ (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma db push
    if [ $? -eq 0 ]; then
        echo "✅ تمت مزامنة قاعدة البيانات"
    else
        echo "❌ فشلت مزامنة قاعدة البيانات"
    fi
fi

# 6. إعادة تشغيل التطبيق
echo -e "\n6️⃣ إعادة تشغيل التطبيق..."
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "✅ تم إعادة تشغيل التطبيق عبر PM2"
    pm2 status
else
    echo "⚠️  PM2 غير مثبت. أعد تشغيل التطبيق يدوياً"
fi

echo -e "\n✨ اكتمل الإصلاح!"
echo "الآن اختبر الموقع مرة أخرى" 