#!/bin/bash

# سكريبت الانتقال من PlanetScale إلى DigitalOcean Database
# يتطلب: mysql client, pscale CLI (اختياري)

set -e

echo "🚀 بدء عملية الانتقال من PlanetScale إلى DigitalOcean"
echo "=================================================="

# المتغيرات - قم بتحديثها حسب بياناتك
PLANETSCALE_HOST=""
PLANETSCALE_USER=""
PLANETSCALE_PASS=""
PLANETSCALE_DB=""

DO_HOST=""
DO_PORT="25060"
DO_USER="doadmin"
DO_PASS=""
DO_DB="defaultdb"

BACKUP_FILE="planetscale_backup_$(date +%Y%m%d_%H%M%S).sql"

# الألوان للطباعة
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# دالة لطباعة الرسائل
print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[تحذير]${NC} $1"
}

print_error() {
    echo -e "${RED}[خطأ]${NC} $1"
}

# التحقق من وجود mysql client
if ! command -v mysql &> /dev/null; then
    print_error "mysql client غير مثبت. يرجى تثبيته أولاً."
    echo "على macOS: brew install mysql-client"
    echo "على Ubuntu: sudo apt-get install mysql-client"
    exit 1
fi

# التحقق من المتغيرات المطلوبة
if [[ -z "$PLANETSCALE_HOST" || -z "$DO_HOST" ]]; then
    print_error "يرجى تحديث المتغيرات في بداية السكريبت"
    exit 1
fi

# الخطوة 1: تصدير البيانات من PlanetScale
print_message "📤 تصدير البيانات من PlanetScale..."

mysqldump -h "$PLANETSCALE_HOST" \
    -u "$PLANETSCALE_USER" \
    -p"$PLANETSCALE_PASS" \
    --ssl-mode=REQUIRED \
    --set-gtid-purged=OFF \
    --no-tablespaces \
    --single-transaction \
    --routines \
    --triggers \
    "$PLANETSCALE_DB" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    print_message "✅ تم تصدير البيانات بنجاح إلى: $BACKUP_FILE"
    print_message "حجم الملف: $(du -h $BACKUP_FILE | cut -f1)"
else
    print_error "فشل تصدير البيانات"
    exit 1
fi

# الخطوة 2: إنشاء نسخة احتياطية مضغوطة
print_message "🗜️ ضغط النسخة الاحتياطية..."
gzip -c "$BACKUP_FILE" > "${BACKUP_FILE}.gz"
print_message "✅ تم إنشاء نسخة مضغوطة: ${BACKUP_FILE}.gz"

# الخطوة 3: اختبار الاتصال بـ DigitalOcean
print_message "🔗 اختبار الاتصال بقاعدة بيانات DigitalOcean..."

mysql -h "$DO_HOST" \
    -P "$DO_PORT" \
    -u "$DO_USER" \
    -p"$DO_PASS" \
    -e "SELECT VERSION();" &> /dev/null

if [ $? -eq 0 ]; then
    print_message "✅ الاتصال بـ DigitalOcean ناجح"
else
    print_error "فشل الاتصال بـ DigitalOcean"
    exit 1
fi

# الخطوة 4: استيراد البيانات
print_warning "سيتم الآن استيراد البيانات إلى DigitalOcean. هذا قد يستغرق بعض الوقت..."
read -p "هل تريد المتابعة؟ (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_message "📥 بدء استيراد البيانات..."
    
    mysql -h "$DO_HOST" \
        -P "$DO_PORT" \
        -u "$DO_USER" \
        -p"$DO_PASS" \
        "$DO_DB" < "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_message "✅ تم استيراد البيانات بنجاح!"
    else
        print_error "فشل استيراد البيانات"
        exit 1
    fi
else
    print_warning "تم إلغاء العملية"
    exit 0
fi

# الخطوة 5: التحقق من البيانات
print_message "🔍 التحقق من البيانات المستوردة..."

TABLE_COUNT=$(mysql -h "$DO_HOST" -P "$DO_PORT" -u "$DO_USER" -p"$DO_PASS" "$DO_DB" \
    -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DO_DB';" \
    -s -N)

print_message "✅ تم استيراد $TABLE_COUNT جدول"

# الخطوة 6: إنشاء ملف .env.digitalocean
print_message "📝 إنشاء ملف إعدادات جديد..."

cat > .env.digitalocean << EOF
# DigitalOcean Database Configuration
DATABASE_URL="mysql://${DO_USER}:${DO_PASS}@${DO_HOST}:${DO_PORT}/${DO_DB}?ssl-mode=REQUIRED"

# نسخ الإعدادات الأخرى من .env.local
EOF

print_message "✅ تم إنشاء .env.digitalocean"

# الخطوة 7: اختبار Prisma
print_message "🧪 اختبار اتصال Prisma..."

# إنشاء نسخة احتياطية من .env الحالي
if [ -f .env ]; then
    cp .env .env.backup
fi

# نسخ الإعدادات الجديدة
cp .env.digitalocean .env

# اختبار Prisma
npx prisma db pull

if [ $? -eq 0 ]; then
    print_message "✅ Prisma متصل بنجاح!"
    npx prisma generate
else
    print_error "فشل اتصال Prisma"
    # استرجاع الإعدادات القديمة
    if [ -f .env.backup ]; then
        mv .env.backup .env
    fi
fi

# الخطوة 8: نصائح ما بعد الانتقال
echo
echo "=================================================="
print_message "🎉 تمت عملية الانتقال بنجاح!"
echo
echo "📋 الخطوات التالية:"
echo "1. تحديث متغيرات البيئة في DigitalOcean App Platform"
echo "2. إعادة نشر التطبيق"
echo "3. اختبار جميع الوظائف"
echo "4. مراقبة الأداء لمدة 24 ساعة"
echo
echo "💾 النسخ الاحتياطية المحفوظة:"
echo "- $BACKUP_FILE (SQL)"
echo "- ${BACKUP_FILE}.gz (مضغوط)"
echo "- .env.backup (إعدادات قديمة)"
echo
print_warning "احتفظ بهذه النسخ لمدة أسبوع على الأقل!"
echo "==================================================" 