#!/bin/bash

# تعيين متغيرات البيئة لإعدادات البريد الإلكتروني
export SMTP_HOST="mail.jur3a.ai"
export SMTP_PORT="465"
export SMTP_USER="noreplay@jur3a.ai"
export SMTP_PASS="oFWD[H,A8~8;iw7("
export SMTP_FROM_EMAIL="noreplay@jur3a.ai"
export SMTP_FROM_NAME="منصة جُرعة"
export SMTP_SECURE="true"
export EMAIL_DEBUG="false"

echo "✅ تم تعيين متغيرات البيئة للبريد الإلكتروني:"
echo "   SMTP_HOST=$SMTP_HOST"
echo "   SMTP_PORT=$SMTP_PORT"
echo "   SMTP_USER=$SMTP_USER"
echo "   SMTP_FROM_EMAIL=$SMTP_FROM_EMAIL"
echo ""
echo "🚀 يمكنك الآن تشغيل الأمر: npm run build" 