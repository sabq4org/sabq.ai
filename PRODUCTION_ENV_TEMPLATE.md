# قالب إعدادات الإنتاج لـ jur3a.ai

## أنشئ ملف `.env.production` بالمحتوى التالي:

```env
# رابط الموقع
NEXT_PUBLIC_BASE_URL=https://jur3a.ai
NEXT_PUBLIC_SITE_URL=https://jur3a.ai

# بيئة الإنتاج
NODE_ENV=production

# إعدادات الأمان
NEXT_PUBLIC_API_URL=https://jur3a.ai/api

# إعدادات البريد الإلكتروني
EMAIL_HOST=mail.jur3a.ai
EMAIL_PORT=587
EMAIL_USER=noreplay@jur3a.ai
EMAIL_PASS=your-email-password
EMAIL_FROM=noreplay@jur3a.ai

# مفاتيح API
OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key

# إعدادات الجلسة
NEXTAUTH_URL=https://jur3a.ai
NEXTAUTH_SECRET=your-secret-key

# تحسينات الأداء
ANALYZE=false
NEXT_TELEMETRY_DISABLED=1
```

## تعليمات مهمة:

1. استبدل جميع القيم التي تحتوي على `your-` بالقيم الحقيقية
2. تأكد من إضافة الملف إلى `.gitignore`
3. لا تشارك هذا الملف أبداً في GitHub 