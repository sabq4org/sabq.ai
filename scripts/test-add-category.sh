#!/bin/bash

echo "🔍 اختبار إضافة تصنيف جديد"
echo "=========================="

# المتغيرات
DOMAIN="https://jur3a.ai"
LOCAL_URL="http://localhost:3000"

# بيانات التصنيف الجديد
TIMESTAMP=$(date +%s)
CATEGORY_DATA='{
  "name": "اختبار '${TIMESTAMP}'",
  "name_en": "Test '${TIMESTAMP}'",
  "slug": "test-'${TIMESTAMP}'",
  "description": "تصنيف تجريبي للاختبار",
  "color": "#FF5733",
  "icon": "🧪",
  "is_active": true
}'

echo "📝 بيانات التصنيف:"
echo "$CATEGORY_DATA" | jq .

echo -e "\n1️⃣ اختبار إضافة تصنيف محلياً..."
echo "================================"

# اختبار محلي
LOCAL_RESPONSE=$(curl -s -X POST $LOCAL_URL/api/categories \
  -H "Content-Type: application/json" \
  -d "$CATEGORY_DATA" \
  -w "\nHTTP_STATUS:%{http_code}")

LOCAL_HTTP_STATUS=$(echo "$LOCAL_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
LOCAL_BODY=$(echo "$LOCAL_RESPONSE" | grep -v "HTTP_STATUS:")

echo "HTTP Status: $LOCAL_HTTP_STATUS"
echo "Response:"
echo "$LOCAL_BODY" | jq . 2>/dev/null || echo "$LOCAL_BODY"

if [ "$LOCAL_HTTP_STATUS" != "201" ] && [ "$LOCAL_HTTP_STATUS" != "200" ]; then
    echo -e "\n❌ فشل إضافة التصنيف محلياً"
    
    # تحليل الخطأ
    if echo "$LOCAL_BODY" | grep -q "DATABASE_URL"; then
        echo "💡 المشكلة: DATABASE_URL غير محدد أو خاطئ"
    elif echo "$LOCAL_BODY" | grep -q "connect"; then
        echo "💡 المشكلة: لا يمكن الاتصال بقاعدة البيانات"
    elif echo "$LOCAL_BODY" | grep -q "prisma"; then
        echo "💡 المشكلة: خطأ في Prisma Client"
    elif echo "$LOCAL_BODY" | grep -q "duplicate"; then
        echo "💡 المشكلة: التصنيف موجود مسبقاً"
    fi
fi

echo -e "\n2️⃣ اختبار إضافة تصنيف على الموقع المباشر..."
echo "========================================="

# اختبار على الموقع المباشر
LIVE_RESPONSE=$(curl -s -X POST $DOMAIN/api/categories \
  -H "Content-Type: application/json" \
  -d "$CATEGORY_DATA" \
  -w "\nHTTP_STATUS:%{http_code}")

LIVE_HTTP_STATUS=$(echo "$LIVE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
LIVE_BODY=$(echo "$LIVE_RESPONSE" | grep -v "HTTP_STATUS:")

echo "HTTP Status: $LIVE_HTTP_STATUS"
echo "Response:"
echo "$LIVE_BODY" | jq . 2>/dev/null || echo "$LIVE_BODY"

if [ "$LIVE_HTTP_STATUS" != "201" ] && [ "$LIVE_HTTP_STATUS" != "200" ]; then
    echo -e "\n❌ فشل إضافة التصنيف على الموقع المباشر"
fi

echo -e "\n3️⃣ فحص قاعدة البيانات مباشرة..."
echo "================================"

# إنشاء سكريبت Node.js للفحص المباشر
cat > test-db-categories.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['error', 'warn']
});

async function testDatabase() {
  try {
    // اختبار الاتصال
    await prisma.$connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // عد التصنيفات
    const count = await prisma.category.count();
    console.log(`📊 عدد التصنيفات الحالي: ${count}`);
    
    // محاولة إضافة تصنيف
    const timestamp = Date.now();
    const newCategory = await prisma.category.create({
      data: {
        name: `تجربة ${timestamp}`,
        nameEn: `Test ${timestamp}`,
        slug: `test-${timestamp}`,
        description: 'تصنيف تجريبي',
        color: '#FF5733',
        icon: '🧪',
        displayOrder: 999,
        isActive: true,
        metadata: {}
      }
    });
    
    console.log('✅ تم إضافة التصنيف بنجاح:');
    console.log(JSON.stringify(newCategory, null, 2));
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    if (error.code === 'P2002') {
      console.error('   السبب: التصنيف موجود مسبقاً (تكرار في slug)');
    } else if (error.code === 'P2025') {
      console.error('   السبب: سجل مرتبط غير موجود');
    } else if (error.message.includes('connect')) {
      console.error('   السبب: فشل الاتصال بقاعدة البيانات');
      console.error('   تحقق من DATABASE_URL في ملف .env');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
EOF

echo "تشغيل اختبار قاعدة البيانات..."
node test-db-categories.js
rm test-db-categories.js

echo -e "\n4️⃣ فحص صلاحيات API..."
echo "====================="

# فحص هل API محمي بمصادقة
AUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST $DOMAIN/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "$CATEGORY_DATA")

if [ "$AUTH_TEST" == "401" ] || [ "$AUTH_TEST" == "403" ]; then
    echo "⚠️  API محمي بمصادقة - تحتاج لتسجيل الدخول أولاً"
fi

echo -e "\n💡 توصيات الإصلاح:"
echo "=================="

echo "1. تحقق من ملف .env على الخادم:"
echo "   - DATABASE_URL موجود وصحيح"
echo "   - JWT_SECRET محدد"

echo -e "\n2. تحقق من Prisma:"
echo "   - شغّل: npx prisma generate"
echo "   - شغّل: npx prisma db push"

echo -e "\n3. تحقق من الصلاحيات:"
echo "   - هل تحتاج لتسجيل دخول؟"
echo "   - هل لديك صلاحيات إضافة تصنيف؟"

echo -e "\n4. راجع السجلات:"
echo "   - pm2 logs"
echo "   - journalctl -u your-app -n 50" 