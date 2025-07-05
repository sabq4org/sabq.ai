#!/bin/bash

echo "🔍 تشخيص مشاكل التطبيق المباشر"
echo "=================================="
echo ""

# 1. التحقق من Build Commands
echo "1️⃣ أوامر البناء المطلوبة في DigitalOcean:"
echo "-----------------------------------"
echo "Build Command:"
echo "npm install && npx prisma generate && npm run build"
echo ""
echo "Run Command:"
echo "npm start"
echo ""

# 2. المتغيرات البيئية المطلوبة
echo "2️⃣ المتغيرات البيئية المطلوبة:"
echo "-----------------------------------"
cat << 'EOF'
DATABASE_URL="استخدم connection string من DigitalOcean مع private-"
NEXT_PUBLIC_SITE_URL="https://sabq-ai.com"
NEXT_PUBLIC_API_URL="https://sabq-ai.com/api"
NODE_ENV="production"
NEXTAUTH_URL="https://sabq-ai.com"
NEXTAUTH_SECRET="<generate-secure-secret>"
JWT_SECRET="<generate-secure-secret>"
EOF
echo ""

# 3. سكريبت فحص سريع
echo "3️⃣ سكريبت فحص سريع (شغله محلياً):"
echo "-----------------------------------"
cat << 'EOF'
# فحص الاتصال بقاعدة البيانات
node scripts/test-prisma-connection.js

# فحص التصنيفات
node scripts/check-categories.js

# إضافة مستخدم admin إذا لزم
node scripts/create-admin-user.js
EOF
echo ""

# 4. أوامر مفيدة للتشخيص
echo "4️⃣ أوامر مفيدة في DigitalOcean Console:"
echo "-----------------------------------"
echo "# عرض السجلات"
echo "npm run logs"
echo ""
echo "# فحص قاعدة البيانات"
echo "npx prisma studio"
echo ""
echo "# إعادة مزامنة قاعدة البيانات"
echo "npx prisma db push"
echo ""

# 5. حلول سريعة
echo "5️⃣ حلول سريعة للمشاكل الشائعة:"
echo "-----------------------------------"
echo "أ) إذا لم تظهر التصنيفات:"
echo "   - تأكد من وجود NODE_ENV=production"
echo "   - أعد النشر مع: npm install && npx prisma generate && npm run build"
echo ""
echo "ب) إذا لم تستطع تسجيل الدخول:"
echo "   - تأكد من NEXTAUTH_SECRET و JWT_SECRET"
echo "   - امسح cookies المتصفح"
echo "   - جرب متصفح آخر"
echo ""
echo "ج) إذا ظهرت أخطاء 500:"
echo "   - افحص Runtime Logs في DigitalOcean"
echo "   - تأكد من DATABASE_URL يستخدم private-"
echo ""

echo "✅ انتهى التشخيص!" 