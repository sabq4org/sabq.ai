#!/bin/bash

echo "🔧 إصلاح اتصال PlanetScale"
echo "========================"

echo -e "\n⚠️  المشكلة الحالية:"
echo "Can't reach database server at aws.connect.psdb.cloud:3306"
echo ""

echo "📝 الحلول المحتملة:"
echo ""

echo "1️⃣ التحقق من صيغة DATABASE_URL:"
echo "   يجب أن تكون بالشكل التالي:"
echo '   DATABASE_URL="mysql://USERNAME:***REMOVED***XXXXXXXXXX@aws.connect.psdb.cloud/DATABASE_NAME?ssl={"rejectUnauthorized":true}"'
echo ""

echo "2️⃣ مثال صحيح لـ DATABASE_URL:"
echo '   DATABASE_URL="mysql://abc123xyz:***REMOVED***1234567890abcdef@aws.connect.psdb.cloud/j3uar_sabq_ai?ssl={"rejectUnauthorized":true}"'
echo ""

echo "3️⃣ نقاط مهمة:"
echo "   - تأكد من وجود ?ssl={\"rejectUnauthorized\":true} في نهاية الرابط"
echo "   - تأكد من أن كلمة المرور تبدأ بـ ***REMOVED***"
echo "   - تأكد من اسم قاعدة البيانات الصحيح"
echo "   - لا تضع مسافات في DATABASE_URL"
echo ""

echo "4️⃣ خطوات الإصلاح:"
echo "   1. عدّل ملف .env بالقيم الصحيحة"
echo "   2. شغّل: npx prisma generate"
echo "   3. أعد تشغيل التطبيق: pm2 restart all"
echo ""

echo "5️⃣ للحصول على DATABASE_URL الصحيح:"
echo "   1. اذهب إلى https://app.planetscale.com"
echo "   2. اختر قاعدة البيانات j3uar_sabq_ai"
echo "   3. اذهب إلى Settings > Passwords"
echo "   4. أنشئ كلمة مرور جديدة أو استخدم الموجودة"
echo "   5. انسخ connection string كاملاً"
echo ""

echo "6️⃣ اختبار الاتصال:"
echo "   بعد التعديل، شغّل هذا الأمر للتأكد:"
echo "   node -e 'const{PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();p.\$connect().then(()=>console.log(\"✅ Connected!\")).catch(e=>console.error(\"❌\",e.message)).finally(()=>p.\$disconnect())'" 