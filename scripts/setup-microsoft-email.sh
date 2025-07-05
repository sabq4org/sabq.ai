#!/bin/bash

# سكريبت إعداد البريد الإلكتروني مع Microsoft 365
echo "📧 إعداد البريد الإلكتروني مع Microsoft 365"
echo "=========================================="
echo ""
echo "⚠️  قبل البدء، تأكد من:"
echo "1. تفعيل المصادقة الثنائية في حساب Microsoft"
echo "2. إنشاء كلمة مرور التطبيق (App Password)"
echo "3. الحصول على كلمة المرور من: https://account.microsoft.com/security"
echo ""
echo "اضغط Enter للمتابعة..."
read

# قراءة المعلومات
echo ""
echo "📝 أدخل بريدك الإلكتروني في Microsoft 365 (مثل: noreply@sabq.org):"
read SMTP_USER

echo ""
echo "🔑 أدخل كلمة مرور التطبيق (16 حرف):"
read -s SMTP_PASS

echo ""
echo ""
echo "📝 أدخل اسم المرسل (افتراضي: صحيفة سبق):"
read EMAIL_FROM_NAME
EMAIL_FROM_NAME=${EMAIL_FROM_NAME:-"صحيفة سبق"}

# تحديث .env.local
echo ""
echo "📄 تحديث ملف .env.local..."

# نسخ احتياطية
if [ -f .env.local ]; then
    cp .env.local .env.local.backup-$(date +%Y%m%d-%H%M%S)
    echo "✅ تم حفظ نسخة احتياطية من .env.local"
fi

# إضافة أو تحديث إعدادات البريد
if [ -f .env.local ]; then
    # إزالة الإعدادات القديمة
    grep -v "^SMTP_" .env.local > .env.local.tmp
    grep -v "^EMAIL_" .env.local.tmp > .env.local
    rm .env.local.tmp
fi

# إضافة الإعدادات الجديدة
cat >> .env.local << EOF

# Microsoft 365 Email Settings
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
SMTP_SECURE=false
SMTP_TLS=true
EMAIL_FROM_NAME=$EMAIL_FROM_NAME
EMAIL_FROM_ADDRESS=$SMTP_USER
ENABLE_EMAIL_VERIFICATION=true
SKIP_EMAIL_VERIFICATION=false
EOF

echo "✅ تم تحديث إعدادات البريد الإلكتروني"

# اختبار الإعدادات
echo ""
echo "🔍 هل تريد اختبار إعدادات البريد؟ (y/n)"
read TEST_EMAIL

if [ "$TEST_EMAIL" = "y" ] || [ "$TEST_EMAIL" = "Y" ]; then
    echo ""
    echo "🧪 تشغيل اختبار البريد..."
    node scripts/test-microsoft-email.js
fi

echo ""
echo "✅ تم إعداد البريد الإلكتروني بنجاح!"
echo ""
echo "📋 الإعدادات المحفوظة:"
echo "   - الخادم: smtp.office365.com"
echo "   - المنفذ: 587"
echo "   - المستخدم: $SMTP_USER"
echo "   - المرسل: $EMAIL_FROM_NAME"
echo ""
echo "🚀 يمكنك الآن:"
echo "1. تشغيل المشروع: ./start-sabq.sh"
echo "2. اختبار البريد: node scripts/test-microsoft-email.js" 