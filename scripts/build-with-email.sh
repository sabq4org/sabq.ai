#!/bin/bash

echo "🚀 بدء عملية البناء مع إعدادات البريد الإلكتروني الصحيحة..."
echo ""

# تعيين متغيرات البيئة
export SMTP_HOST="mail.jur3a.ai"
export SMTP_PORT="465"
export SMTP_USER="noreplay@jur3a.ai"
export SMTP_PASS="oFWD[H,A8~8;iw7("
export SMTP_FROM_EMAIL="noreplay@jur3a.ai"
export SMTP_FROM_NAME="منصة جُرعة"
export SMTP_SECURE="true"
export EMAIL_DEBUG="false"
export NODE_ENV="production"

echo "✅ تم تعيين متغيرات البيئة:"
echo "   SMTP_HOST=$SMTP_HOST"
echo "   SMTP_PORT=$SMTP_PORT"
echo "   SMTP_USER=$SMTP_USER"
echo "   SMTP_FROM_EMAIL=$SMTP_FROM_EMAIL"
echo ""

# حذف مجلد البناء السابق
echo "🗑️  حذف مجلد البناء السابق..."
rm -rf .next

# البناء
echo "🔨 بدء عملية البناء..."
npm run build

# التحقق من نجاح البناء
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ تمت عملية البناء بنجاح!"
    echo ""
    echo "📦 الخطوات التالية:"
    echo "   1. رفع الملفات إلى الخادم"
    echo "   2. تشغيل: npm start"
    echo ""
else
    echo ""
    echo "❌ فشلت عملية البناء!"
    echo "   تحقق من الأخطاء أعلاه وحاول مرة أخرى."
    exit 1
fi 