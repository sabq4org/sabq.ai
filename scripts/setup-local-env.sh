#!/bin/bash

echo "🔧 إعداد البيئة المحلية..."

# إنشاء ملف .env.local
cat > .env.local << 'EOF'
# بيئة التطوير المحلية
NODE_ENV=development

# عنوان التطبيق
NEXT_PUBLIC_APP_URL=http://localhost:3002
NEXT_PUBLIC_API_URL=http://localhost:3002/api

# قاعدة البيانات (استخدم نفس الإعدادات من السيرفر)
# DATABASE_URL=mysql://j3uar_sabq_aiuser:J3uarSabqCMS2025@localhost:3306/j3uar_sabq_ai?authentication_plugin=mysql_native_password

# مفتاح JWT
JWT_SECRET=your-local-secret-key-change-this

# إعدادات البريد (اختياري للتطوير)
SMTP_HOST=mail.jur3a.ai
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreplay@jur3a.ai
SMTP_PASS=your-email-password
EMAIL_FROM=noreplay@jur3a.ai

# OpenAI (اختياري)
OPENAI_API_KEY=your-openai-key

# تعطيل التحقق من البريد في التطوير
SKIP_EMAIL_VERIFICATION=true
EOF

echo "✅ تم إنشاء .env.local"
echo ""
echo "⚠️  تأكد من تحديث إعدادات قاعدة البيانات في .env.local"
echo ""
echo "🚀 الآن يمكنك تشغيل: npm run dev" 