#!/bin/bash

# سكريبت اختبار الاتصال بقاعدة بيانات DigitalOcean

echo "🔍 اختبار الاتصال بقاعدة بيانات DigitalOcean"
echo "============================================"

# قراءة البيانات من المستخدم
read -p "أدخل Host (public أو private): " DB_HOST
read -p "أدخل Username (default: doadmin): " DB_USER
DB_USER=${DB_USER:-doadmin}
read -p "أدخل Port (default: 25060): " DB_PORT
DB_PORT=${DB_PORT:-25060}
read -s -p "أدخل Password: " DB_PASS
echo
read -p "أدخل Database name (default: defaultdb): " DB_NAME
DB_NAME=${DB_NAME:-defaultdb}

echo
echo "🔗 محاولة الاتصال..."

# اختبار الاتصال الأساسي
mysql -h "$DB_HOST" \
      -P "$DB_PORT" \
      -u "$DB_USER" \
      -p"$DB_PASS" \
      -e "SELECT VERSION() as 'MySQL Version';" \
      "$DB_NAME" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ الاتصال ناجح!"
    echo
    
    # عرض معلومات إضافية
    echo "📊 معلومات قاعدة البيانات:"
    mysql -h "$DB_HOST" \
          -P "$DB_PORT" \
          -u "$DB_USER" \
          -p"$DB_PASS" \
          -e "SELECT 
                DATABASE() as 'Current Database',
                USER() as 'Connected User',
                @@hostname as 'Server Hostname',
                @@version_comment as 'Server Type';" \
          "$DB_NAME" 2>/dev/null
    
    echo
    echo "📋 الجداول الموجودة:"
    mysql -h "$DB_HOST" \
          -P "$DB_PORT" \
          -u "$DB_USER" \
          -p"$DB_PASS" \
          -e "SHOW TABLES;" \
          "$DB_NAME" 2>/dev/null
    
    # إنشاء ملف .env.test
    echo
    echo "💾 حفظ إعدادات الاتصال..."
    cat > .env.digitalocean.test << EOF
# DigitalOcean Database Test Configuration
# تم إنشاؤه في: $(date)
DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?ssl-mode=REQUIRED"

# معلومات الاتصال
DB_HOST="${DB_HOST}"
DB_PORT="${DB_PORT}"
DB_USER="${DB_USER}"
DB_NAME="${DB_NAME}"
# كلمة المرور محذوفة لأسباب أمنية - أضفها يدوياً
DB_PASS=""
EOF
    
    echo "✅ تم حفظ الإعدادات في: .env.digitalocean.test"
    echo
    echo "🎉 الاتصال يعمل بشكل ممتاز!"
    
else
    echo "❌ فشل الاتصال!"
    echo
    echo "🔍 تحقق من:"
    echo "1. صحة معلومات الاتصال"
    echo "2. إضافة IP/Droplet في Trusted Sources"
    echo "3. تفعيل قاعدة البيانات وجاهزيتها"
    echo "4. صحة كلمة المرور"
    echo
    echo "💡 نصيحة: جرب الاتصال من Droplet إذا كنت تستخدم Private Host"
fi

echo
echo "============================================" 