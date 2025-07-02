#!/bin/bash

echo "🔍 تشخيص مشاكل الإنتاج"
echo "======================="

# ألوان للتوضيح
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. معلومات النظام
echo -e "\n📊 معلومات النظام:"
echo "- نظام التشغيل: $(uname -a)"
echo "- Node.js: $(node -v)"
echo "- npm: $(npm -v)"
echo "- المجلد الحالي: $(pwd)"

# 2. فحص العمليات
echo -e "\n🔄 العمليات النشطة:"
if command -v pm2 &> /dev/null; then
    pm2 list
else
    ps aux | grep node | grep -v grep
fi

# 3. فحص المنافذ
echo -e "\n🌐 المنافذ المستخدمة:"
netstat -tlnp 2>/dev/null | grep :3000 || lsof -i :3000 2>/dev/null || echo "لا يمكن فحص المنفذ 3000"

# 4. فحص الملفات المطلوبة
echo -e "\n📁 فحص الملفات المطلوبة:"
FILES_TO_CHECK=(
    ".env"
    "package.json"
    "prisma/schema.prisma"
    ".next/BUILD_ID"
    "node_modules/.prisma/client/index.js"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file - موجود"
    else
        echo -e "${RED}❌${NC} $file - مفقود"
    fi
done

# 5. فحص السجلات
echo -e "\n📝 آخر أخطاء في السجلات:"
if command -v pm2 &> /dev/null; then
    echo "من PM2:"
    pm2 logs --err --lines 10 --nostream
fi

# فحص سجلات النظام
if [ -f "/var/log/nginx/error.log" ]; then
    echo -e "\nمن Nginx:"
    sudo tail -n 10 /var/log/nginx/error.log 2>/dev/null || echo "لا يمكن قراءة سجلات Nginx"
fi

# 6. اختبار API مع تفاصيل الأخطاء
echo -e "\n🔌 اختبار API endpoints:"

# Health check
echo -n "- /api/health: "
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3000/api/health)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep HTTP_CODE | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | grep -v HTTP_CODE)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ يعمل${NC}"
else
    echo -e "${RED}❌ فشل (HTTP $HTTP_CODE)${NC}"
    echo "   الاستجابة: $BODY"
fi

# Categories API
echo -n "- /api/categories: "
CATEGORIES_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3000/api/categories)
HTTP_CODE=$(echo "$CATEGORIES_RESPONSE" | grep HTTP_CODE | cut -d: -f2)
BODY=$(echo "$CATEGORIES_RESPONSE" | grep -v HTTP_CODE)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ يعمل${NC}"
else
    echo -e "${RED}❌ فشل (HTTP $HTTP_CODE)${NC}"
    echo "   الاستجابة: $BODY"
fi

# 7. اقتراحات الإصلاح
echo -e "\n💡 اقتراحات الإصلاح:"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}1. أنشئ ملف .env مع المتغيرات المطلوبة${NC}"
    echo "   شغّل: ./scripts/create-production-env.sh"
fi

if [ ! -f "node_modules/.prisma/client/index.js" ]; then
    echo -e "${YELLOW}2. ولّد Prisma Client${NC}"
    echo "   شغّل: npx prisma generate"
fi

if [ ! -f ".next/BUILD_ID" ]; then
    echo -e "${YELLOW}3. ابنِ التطبيق${NC}"
    echo "   شغّل: npm run build"
fi

# 8. معلومات قاعدة البيانات
echo -e "\n🗄️ فحص قاعدة البيانات:"
if [ -f ".env" ]; then
    DB_URL=$(grep DATABASE_URL .env | cut -d'=' -f2 | sed 's/"//g' | sed 's/:[^:]*@/:****@/')
    echo "DATABASE_URL: $DB_URL"
    
    # محاولة الاتصال
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$connect()
        .then(() => {
            console.log('✅ الاتصال بقاعدة البيانات نجح');
            return prisma.\$disconnect();
        })
        .catch(err => {
            console.error('❌ فشل الاتصال:', err.message);
            process.exit(1);
        });
    " 2>&1
else
    echo -e "${RED}❌ ملف .env غير موجود${NC}"
fi

echo -e "\n✨ اكتمل التشخيص!" 