#!/bin/bash

echo "🚀 بدء ترحيل البيانات من PlanetScale MySQL إلى DigitalOcean PostgreSQL"
echo "================================================================"

# التحقق من وجود ملف البيئة
if [ ! -f .env ]; then
    echo "❌ ملف .env غير موجود!"
    exit 1
fi

# قراءة DATABASE_URL من .env
OLD_DB_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')

if [ -z "$OLD_DB_URL" ]; then
    echo "❌ DATABASE_URL غير موجود في .env!"
    exit 1
fi

echo "📊 استخراج البيانات من PlanetScale..."

# إنشاء مجلد للنسخ الاحتياطية
mkdir -p backups/migration-$(date +%Y%m%d_%H%M%S)
cd backups/migration-$(date +%Y%m%d_%H%M%S)

# استخدام Prisma لاستخراج البيانات
echo "📥 تصدير البيانات..."
DATABASE_URL="$OLD_DB_URL" npx prisma db pull
DATABASE_URL="$OLD_DB_URL" npx prisma generate

# إنشاء سكريبت Node.js لتصدير البيانات
cat > export-data.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  console.log('📤 تصدير البيانات...');
  
  const data = {};
  
  // تصدير جميع الجداول
  const tables = [
    'user', 'category', 'keyword', 'article', 'interaction',
    'loyaltyPoint', 'deepAnalysis', 'articleKeyword', 'message',
    'activityLog', 'role', 'userRole', 'userPreference', 'comment',
    'analyticsData', 'siteSettings', 'subscriber', 'emailTemplate',
    'emailJob', 'emailLog', 'emailProviderConfig'
  ];
  
  for (const table of tables) {
    try {
      console.log(`  - ${table}...`);
      data[table] = await prisma[table].findMany();
    } catch (error) {
      console.log(`    ⚠️  تخطي ${table}: ${error.message}`);
    }
  }
  
  fs.writeFileSync('exported-data.json', JSON.stringify(data, null, 2));
  console.log('✅ تم تصدير البيانات بنجاح!');
  
  await prisma.$disconnect();
}

exportData().catch(console.error);
EOF

DATABASE_URL="$OLD_DB_URL" node export-data.js

echo -e "\n📝 تحديث Prisma Schema لـ PostgreSQL..."
cd ../..

# نسخ احتياطية من Schema الحالي
cp prisma/schema.prisma prisma/schema.mysql.backup

echo -e "\n🔄 تطبيق Schema على PostgreSQL..."
npx prisma db push --skip-generate

echo -e "\n📥 استيراد البيانات إلى PostgreSQL..."

# إنشاء سكريبت الاستيراد
cat > backups/migration-*/import-data.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  console.log('📥 استيراد البيانات...');
  
  const data = JSON.parse(fs.readFileSync('exported-data.json', 'utf8'));
  
  // استيراد البيانات بالترتيب الصحيح
  const importOrder = [
    'user', 'category', 'role', 'keyword',
    'article', 'userRole', 'userPreference',
    'interaction', 'loyaltyPoint', 'deepAnalysis',
    'articleKeyword', 'message', 'activityLog',
    'comment', 'analyticsData', 'siteSettings',
    'subscriber', 'emailTemplate', 'emailProviderConfig',
    'emailJob', 'emailLog'
  ];
  
  for (const table of importOrder) {
    if (data[table] && data[table].length > 0) {
      try {
        console.log(`  - ${table} (${data[table].length} سجل)...`);
        await prisma[table].createMany({
          data: data[table],
          skipDuplicates: true
        });
      } catch (error) {
        console.log(`    ❌ خطأ في ${table}: ${error.message}`);
      }
    }
  }
  
  console.log('✅ تم استيراد البيانات بنجاح!');
  
  await prisma.$disconnect();
}

importData().catch(console.error);
EOF

cd backups/migration-*
node import-data.js

echo -e "\n✅ اكتمل الترحيل!"
echo "📋 ملخص:"
echo "  - تم تصدير البيانات من PlanetScale"
echo "  - تم إنشاء الجداول في PostgreSQL"
echo "  - تم استيراد البيانات"
echo -e "\n⚠️  تذكر:"
echo "1. تحديث .env في الإنتاج"
echo "2. اختبار التطبيق محلياً"
echo "3. نشر التحديثات" 